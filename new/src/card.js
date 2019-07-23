import SVGAnim from "./svg.js";
import IdlePromise from "./idlePromise.js"


class ElementState {
	constructor(element) {
		this.element = element

		// processed  : whether the svg has been processed (content is created based on XML, erase path is put in front, size is calculated based on viewbox)
		// texted     : whether the svg's <text> has been replaced w/ animatable <path> letters
		// active     : whether the card is the current one (z-index higher, current keyboard selection, is open, was just open, or will be opened)
		// open       : whether the card is in the grid, or poped-out to the front
		// hydrated   : whether the card was hydrated with info from the database (php dump only for now)
		// front      : TODO ???

		const states = ['hydrated', 'open', 'processed', 'texted', 'active', 'front']
		states.forEach(prop => {
			this[`_${prop}`] = false
			Object.defineProperty(this, prop, {
				set: function (bool) {
					this[`_${prop}`] = bool
					this.element.classList[bool ? 'add' : 'remove'](prop)
					if (bool) document.dispatchEvent(new CustomEvent(prop, { detail: { card: this.element } }))
				},
				get: function () {
					return this[`_${prop}`]
				}
			})
		})
	}
}


// playable = new IdlePromise([
// 	// wait for worker, hydration, and DOM data
// 	() => Promise.all([
// 		new Promise(resolve => this.workerPromise = resolve),
// 		new Promise(resolve => this.hydratePromise = resolve),
// 		() => {
// 			const svg = this.querySelector('svg')
// 			if(svg)
// 				this.rawXML = this.svg.outerHTML
// 		},
// 	]),
// 	// notify worker
// 	() => this.registerToWorker(),
// 	// wait for SVG data, and font
// 	() => Promise.all([
// 		this.getContent(),
// 		document.fonts.load('1em Permanent Marker')
// 	]),
// 	// sequentially do all necessary work on SVG
// 	([xml]) => workInTemplate(xml),
// 	(svg) => workInDom(svg),
// 	// wait for alphabet to be required
// 	(svg) => new Promise(resolve => this.alphabetPromise = () => {resolve(svg)}),
// 	(svg) => alphabet(svg),
// 	// decompose alphabet
// 	// add extra step of calculating length of each SVGGraphicsElement
// 	// return true at the end
// ])


class TriggerPromise {
    constructor() {
        this._promise = new Promise(resolve => this.resolve = resolve)
    }

    then(callback) {
        return this._promise.then(callback)
    }
}


export default class SVGCard extends HTMLElement {
	constructor() {
		super()

		//TODO: careful the <svg-card> placeholder will try to instantiate here like the other ones. Maybe make it a <div> instead

		this.svg = this.querySelector('svg')
		this.anchor = this.querySelector('a')
		this.state = new ElementState(this)
		this.info = {} // metadata about graph content (release date, author, tags...)
		this.registerToWorker()

		this.addEventListener('mouseenter', () => {
			if (this.state.processed) this.alphabet()
			else this.shouldProcessAlphabet = true
		}, { once: true })

		// external triggers
		this.workerPromise = new TriggerPromise()
		this.hydratePromise = new TriggerPromise()
		this.alphabetPromise = new TriggerPromise()
		// flags
		this.shouldProcess = false
		this.shouldAlphabet = false
	}

	registerToWorker() {
		Promise.all([
			this.workerPromise,
			this.hydratePromise
		]).then(() => {
			console.log(this)
			// hydrate worker
			requestIdleCallback(() => this._worker.postMessage(JSON.stringify({
				type: 'hydrate',
				data: {
					name: this.name,
					XML: !!this.rawXML
				}
			})))
		})
	}

	set worker(worker) {
		this._worker = worker
		console.log(this._worker)
		this.workerPromise.resolve()
		delete this.workerPromise
		console.log(this._worker)
	}

	set graph(graph) {
		this.info.release = graph.release
		this.info.credit = graph.credit
		this.info.author = graph.author
		this.name = graph.name
		this.anchor.href = `/${graph.name}`

		if (this.svg)
			this.rawXML = this.svg.outerHTML

		this.classList.forEach(className => {
			if (className in this.state)
				this.state[className] = true
		})

		this.state.hydrated = true
		this.hydratePromise.resolve()
		delete this.hydratePromise
	}

	play() {
		return SVGAnim.prepare(this.svg)
			.then(() => SVGAnim.animate(this.svg))
	}

	resume() {
		// TODO (probably to integrate to play() and an associated this.state.playing flag)
		// will allow for changing speed of animation during animation
	}

	erase() {
		return new Promise(resolve => {
			SVGAnim.freeze(this.svg)
				.then(() => SVGAnim.prepare(this.erasePath, false))
				.then(() => SVGAnim.animate(this.erasePath, false))
				.then(resolve)
		})
	}

	unerase() {
		this.erasePath.style.display = 'none'
		return SVGAnim.reset(this.svg)
	}

	async immediate() {
		this.state.processing = true
		const [xml] = await Promise.all([
			this.getContent(),
			document.fonts.load('1em Permanent Marker')
		]);
		this.shouldProcessAlphabet = true;
		await this.processSVG(xml);
		SVGAnim.prepare(this.svg);
		requestAnimationFrame(() => {
			delete this.state.processing;
			this.state.active = true;
			this.state.open = true;
			this.state.front = true;
			SVGAnim.animate(this.svg);
			this.classList.remove('start-active');
		});
	}

	async alphabet() {
		const promise = this.state.texted ? Promise.resolve() : SVGAnim.textToSVGAlphabet(this.svg)
		await promise;
		delete this.shouldProcessAlphabet;
		this.state.texted = true;
	}

	processSVG(xml) {
		let resolve
		const promise = new Promise(res => resolve = res)

		// SVG starts in template (doesn't trigger DOM)
		const workInTemplate = () => {
			this.rawXML = xml
			const template = document.createRange().createContextualFragment(xml) // TODO: add a fallback to new DOMParser().parseFromString ??
			const svg = template.firstElementChild

			// the first white path should be the "erase" path so put it on top and label it so we can use it later
			this.erasePath = svg.querySelector('path[stroke="#FFFFFF"]')
			svg.removeChild(this.erasePath)
			this.erasePath.setAttribute('data-type', 'erase')
			this.erasePath.style.display = 'none'
			svg.appendChild(this.erasePath)

			// get all graphs to "look the same size" (meaning a small graph isn't displayed big to occupy all the available space)
			const SIZE_FACTOR = 1.4 // this formula assumes a max SVG size of 1000x1000px in Illustrator
			const viewbox = svg.getAttribute('viewBox').split(' ')
			const svgbox = svg.getBoundingClientRect()
			if (svgbox.width < svgbox.height)
				svg.style.width = (.9 * SIZE_FACTOR * viewbox[2] / 10) + '%'
			else
				svg.style.height = (.9 * SIZE_FACTOR * viewbox[3] / 10) + '%'

			return svg
		}

		// SVG is in DOM
		const workInDom = (svg) => {
			// put SVG into place
			if (this.svg)
				this.replaceChild(svg, this.querySelector('svg'))
			else
				this.appendChild(svg)
			this.svg = svg
			this.state.processed = true
			if (!this.shouldProcessAlphabet)
				resolve(this)
			// replace <text> font elements, with <g> SVG elements (only if already requested before)
			else
				requestAnimationFrame(() => {
					this.alphabet()
						.then(() => resolve(this))
				})
		}

		requestIdleCallback(() => {
			const svg = workInTemplate()
			requestAnimationFrame(() => workInDom(svg))
		})

		return promise
	}

	getContent() {
		const getRaw = new Promise((resolve, reject) => {
			// already in here
			if (this.rawXML) {
				resolve(this.rawXML)
				return
			}

			// request from worker
			this._worker.customWorkerResponses.push(message => {
				// check if this response is for this card
				if (message.name !== this.name)
					return false
				resolve(message.XML)
				return true
			})
			this._worker.postMessage(JSON.stringify({
				type: 'request',
				data: {
					name: this.name
				}
			}))
		})

		return getRaw
	}
}