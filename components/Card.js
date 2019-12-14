import IdleNetwork from '/modules/IdleNetwork.js'
import TextToAlphabet from '/modules/TextToAlphabet.js'
import SVGAnim from '/modules/SVGAnim.js'
import IndexedDBManager from '/modules/IndexedDB.js'

/**
 * scenario
 * 
 * 1. promise.all
 * - raw svg > processed svg (first path to top, viewbox resize)
 * - parsed alphabet
 * - loaded font
 * |-> replace text 
 * 
 * 2.
 * - fetch graph data > fill template
 * 
 * promise.all([1, 2])
 * - store to indexedDB
 * 
 * promise.then(1)
 * - compute anim
 * - erase
 * - play
 */

export default class SVGCard extends HTMLElement {

	constructor() {
		super()
		this.SVGAnim = new SVGAnim()
		this.IndexedDBManager = new IndexedDBManager()
		this.IdleNetwork = new IdleNetwork()
		this.finishPromise = new Promise(resolve => this.finishResolve = resolve)
		this.readyPromise = new Promise(resolve => this.readyResolve = resolve)
	}

	async findStep() {
		const name = this.attributes.name && this.attributes.name.value

		if (!name)
			return

		const cached = await this.IndexedDBManager.getGraph(name)
		if (cached) {
			const domparser = new DOMParser()
			const fragment = domparser.parseFromString(cached, 'image/svg+xml')
			return await this.startFromStep('cached', { cached: fragment.firstElementChild, name })
		}
		const raw = this.querySelector('svg')
		if (raw)
			return await this.startFromStep('raw', { raw, name })

		return await this.startFromStep('named', { name })
	}

	startFromStep(step, args) {
		let { name, raw, cached } = args
		return new Promise(async resolve => {
			switch (step) {
				case 'named':
					const fetched = await this.fetch(name)
					const domparser = new DOMParser()
					const fragment = domparser.parseFromString(fetched, 'image/svg+xml')
					raw = fragment.firstElementChild
					this.appendChild(fragment.firstElementChild)
				case 'raw':
					cached = await this.process(raw)
					await this.alphabetize(cached)
					this.cache(name, cached)
				case 'cached':
					this.classList.add('alphabetized')
					await this.use(cached)
				case 'ready':
					await resolve()
			}
		})
	}

	use(node) {
		const previous = this.querySelector('svg')
		if (previous)
			this.replaceChild(node, previous)
		else
			this.appendChild(node)
		return
	}


	cache(name, node) {
		this.IndexedDBManager.saveGraph({ name, node })
	}

	async alphabetize(node) {
		const alphabetizer = new TextToAlphabet(node)
		await Promise.race([
			alphabetizer.promise,
			this.finishPromise.then(alphabetizer.finish)
		])
		return node
	}

	process(node) {
		// resize
		const SIZE_FACTOR = 1.4 // this formula assumes a max SVG size of 1000x1000px in Illustrator
		const [, , width, height] = node.getAttribute('viewBox').split(' ')
		if (width < height)
			node.style.width = (.9 * SIZE_FACTOR * width / 10) + '%'
		else
			node.style.height = (.9 * SIZE_FACTOR * height / 10) + '%'
		// TODO: resize should happen before caching AND BE CACHED somehow

		// find and reorder "erase"
		this.erase = node.firstElementChild
		this.erase.dataset.erase = true
		node.appendChild(this.erase)

		return node
	}

	async fetch(name) {
		let idleRequestId
		const graphURL = `/graphs/graphs_${name}.svg`
		return await Promise.race([
			new Promise(resolve => {
				idleRequestId = this.IdleNetwork.requestIdleNetwork(graphURL, resolve)
			}),
			new Promise(resolve => this.finishPromise.then(async () => {
				const cancelable = this.IdleNetwork.cancelIdleNetwork(idleRequestId)
				if (cancelable)
					resolve(await fetch(graphURL))
			}))
		]).then(response => response.text())
	}

	finish() {
		this.finishResolve()
		return this.readyPromise
	}

	connectedCallback() {
		const template = document.getElementById('svg-card');
		const fragment = document.importNode(template.content, true);
		this.attachShadow({ mode: 'open' })
		this.shadowRoot.appendChild(fragment)

		// TODO: use ≠ promise triggers for the ≠ steps of the scenario
		//	- on intersectionObserver, trigger up to raw svg
		//	- on mouseOver, trigger up to alphabetized and processed
		//	- on click, trigger all the way


		document.fonts.load('1em Permanent Marker').then(() => this.classList.add('font-loaded'))

		// request whenever there is down time in the network
		this.findStep().then(() => {
			if (this.intersectionObserver) {
				this.intersectionObserver.disconnect()
				delete this.intersectionObserver
			}
		})
		// if in viewport, request immediately
		// this.intersectionObserver = new IntersectionObserver(([intersection]) => {
		// 	if (!intersection.isIntersecting)
		// 		return
		// 	this.intersectionObserver.disconnect()
		// 	delete this.intersectionObserver
		// 	this.finish()
		// })
		// this.intersectionObserver.observe(this);

	}

}