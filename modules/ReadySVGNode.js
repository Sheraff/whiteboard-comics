import IdleNetwork from '../interfaces/IdleNetwork.js'
import IndexedDBManager from '../interfaces/IndexedDB.js'
import SWJpegBlobUploader from '../interfaces/SWJpegBlobUploader.js'
import hex2hsl from '../functions/hex2hsl.js'
import svgToImageBlob from '../functions/svgToImageBlob.js'
import TextToAlphabet from './TextToAlphabet.js'
import IdlePromise from './IdlePromise.js'

export default class ReadyNode {
	constructor(parent) {
		this.parent = parent
		this.name = this.parent.attributes.name && this.parent.attributes.name.value
		if (!this.name) return

		this.IndexedDBManager = new IndexedDBManager()

		this.displayPromise = new IdlePromise(this.runDisplay.bind(this))
		this.fullPromise = new IdlePromise(this.runFull.bind(this))

		this.fullPromise.addUrgentListener(this.displayPromise.finish)
		this.then = this.fullPromise.then
		this.catch = this.fullPromise.catch
		this.finally = this.fullPromise.finally

		this.display = this.displayPromise.finish
		this.finish = this.fullPromise.finish

		this.staticPromise = new IdlePromise(this.makeStatic.bind(this))
	}

	get urgent() {
		return this.fullPromise.urgent
	}

	// TODO: add SVGO cleanup step (and store only cleaned-up state in IndexedDB) before alphabetization

	async * runDisplay(resolve) {
		let node, erase, color, date

		yield
		const cached = await this.IndexedDBManager.getGraph(this.name)

		yield
		if (Boolean(cached)) {
			const domparser = new DOMParser()
			yield 45
			node = domparser.parseFromString(cached.node, 'image/svg+xml').firstElementChild
			yield 20
			erase = domparser.parseFromString(cached.erase, 'image/svg+xml').firstElementChild
			color = cached.color
			date = cached.date
		} else {
			let raw = this.parent.querySelector('svg')
			if (!raw) {
				yield
				const fetched = await this.fetch(this.displayPromise, this.name)
				yield
				const domparser = new DOMParser()
				yield 45
				raw = domparser.parseFromString(fetched, 'image/svg+xml').firstElementChild
			}
			yield
			const processed = await this.process(this.displayPromise, raw, this.parent)
			node = processed.node
			erase = processed.erase
			color = processed.color
			date = Date.now()
		}
		yield
		const { width, height, boundWidth, boundHeight } = this.applySize(node, this.parent)
		this.parent.dimensions = {
			width, 
			height,
			boundHeight: boundHeight || 100,
			boundWidth: boundWidth || 100,
		}
		yield
		this.addClass(this.displayPromise, 'sized')
		const hslString = await this.use(this.displayPromise, node, erase, color)
		yield
		this.parent.style.color = hslString
		resolve({ name: this.name, node, erase, color, date, cached: Boolean(cached) })
	}

	async * runFull(resolve) {
		yield
		const { node, erase, color, date, cached } = await this.displayPromise
		yield
		if (!cached) {
			await this.alphabetize(this.fullPromise, node)
			yield
			this.cache(this.name, node, erase, color, date)
		} else {
			await TextToAlphabet.defineClips(this.fullPromise, node)
			yield
		}
		this.addClass(this.fullPromise, 'alphabetized')
		resolve({ node, erase, color })
	}

	addClass(idlePromise, className) {
		if (idlePromise.urgent)
			return this.parent.classList.add(className)
		let idleRequestId = requestAnimationFrame(() => this.parent.classList.add(className))

		idlePromise.addUrgentListener(() => {
			cancelAnimationFrame(idleRequestId)
			this.parent.classList.add(className)
		})
	}

	applySize(node, parent) {
		const SIZE_FACTOR = 1.4 // this formula assumes a max SVG size of 1000x1000px in Illustrator
		const [, , width, height] = node.getAttribute('viewBox').split(' ')
		const result = { width, height }
		if (width < height) {
			const boundWidth = .9 * SIZE_FACTOR * width / 10
			parent.style.setProperty('--bound-width', `${boundWidth}%`)
			result.boundWidth = boundWidth
		} else {
			const boundHeight = .9 * SIZE_FACTOR * height / 10
			parent.style.setProperty('--bound-height', `${boundHeight}%`)
			result.boundHeight = boundHeight
		}
		return result
	}

	use(parentIdlePromise, node, erase, color) {
		const idlePromise = new IdlePromise((async function* (resolve) {
			const previous = this.parent.querySelector('svg')
			yield
			if (previous)
				this.parent.replaceChild(node, previous)
			else
				this.parent.appendChild(node)
			yield
			this.parent.appendChild(erase)
			yield
			const hsl = hex2hsl(color)
			resolve(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)
		}).bind(this))

		parentIdlePromise.addUrgentListener(idlePromise.finish)

		return idlePromise
	}

	cache(name, node, erase, color, date) {
		this.IndexedDBManager.saveGraph({ name, node, erase, color, date })
	}

	alphabetize(idlePromise, node) {
		const alphabetizer = new TextToAlphabet(node, this.name)

		idlePromise.addUrgentListener(alphabetizer.finish)

		return alphabetizer
	}

	process(parentIdlePromise, node, parent) {

		const idlePromise = new IdlePromise(async function* (resolve) {
			yield
			node.removeAttribute('id')
			// find and extract "erase"
			const erasePath = node.firstElementChild
			erasePath.dataset.type = 'erase'
			yield
			const erase = node.cloneNode(false)
			erase.setAttribute('slot', 'erase')
			yield
			erase.appendChild(erasePath)
			// set attributes
			node.dataset.main = true

			yield
			// find color
			const firstColoredNode = node.querySelector(`
				[stroke]:not([stroke="#FFFFFF"]):not([stroke="#000000"]):not([stroke="#010101"]):not([fill]), 
				[stroke]:not([stroke="#FFFFFF"]):not([stroke="#000000"]):not([stroke="#010101"])[fill="none"], 
				[fill]:not([fill="#FFFFFF"]):not([fill="#000000"]):not([fill="#010101"]):not([fill="#231F20"]):not([stroke])
			`)
			const stroke = firstColoredNode.getAttribute('stroke')
			const fill = firstColoredNode.getAttribute('fill')
			const color = stroke && stroke !== "none" ? stroke : fill

			resolve({ node, erase, color })
		})

		parentIdlePromise.addUrgentListener(idlePromise.finish)

		return idlePromise
	}

	fetch(idlePromise, name) {
		const URL = `/graphs/graphs_${name}.svg`

		if(!this.IdleNetwork)
			this.IdleNetwork = new IdleNetwork()

		if (idlePromise.urgent)
			return this.IdleNetwork.race(URL)

		let idleRequestId
		return Promise.race([
			new Promise(resolve => {
				idleRequestId = this.IdleNetwork.requestIdleNetwork(URL, resolve)
			}),
			new Promise(resolve => idlePromise.addUrgentListener(() => {
				const cancelable = this.IdleNetwork.cancelIdleNetwork(idleRequestId)
				if (cancelable)
					resolve(this.IdleNetwork.race(URL))
			}))
		])
	}

	async * makeStatic(resolve, reject) {
		const src = `/static/graphs_${this.name}.jpg`
		const jpegBlobUploader = new SWJpegBlobUploader()

		yield
		const cached = await jpegBlobUploader.has(src)

		yield
		const img = document.createElement('img')
		img.setAttribute('slot', 'static')
		img.setAttribute('alt', `static version of animated SVG graph ${this.name}`)

		const loadPromise = new Promise(resolve => {
			img.addEventListener('load', resolve, { once: true })
			img.addEventListener('error', reject, { once: true })
		})

		if (cached) {
			img.src = src
		} else {
			const { node } = await this.fullPromise
			yield
			const buffer = await svgToImageBlob(node)
			yield
			jpegBlobUploader.put(src, buffer, src => img.src = src)
		}

		await loadPromise

		yield
		this.parent.appendChild(img)
		this.parent.classList.add('static-img')
		resolve(img)
	}
}