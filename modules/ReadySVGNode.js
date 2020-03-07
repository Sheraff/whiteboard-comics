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
		this.IdleNetwork = new IdleNetwork()

		this.displayPromise = new IdlePromise(this.runDisplay.bind(this))
		this.fullPromise = new IdlePromise(this.runFull.bind(this))

		this.fullPromise.addUrgentListener(this.displayPromise.finish)
		this.then = this.fullPromise.then
		this.display = this.displayPromise.finish
		this.finish = this.fullPromise.finish

		this.then(this.makeStatic.bind(this))
	}

	get urgent() {
		return this.fullPromise.urgent
	}

	// TODO: add SVGO cleanup step (and store only cleaned-up state in IndexedDB) before alphabetization

	async * runDisplay(resolve) {
		let node, erase, color

		yield
		const cached = await this.IndexedDBManager.getGraph(this.name)
		this.wasInCache = Boolean(cached)

		yield
		if (this.wasInCache) {
			const domparser = new DOMParser()
			yield 45
			node = domparser.parseFromString(cached.node, 'image/svg+xml').firstElementChild
			yield 20
			erase = domparser.parseFromString(cached.erase, 'image/svg+xml').firstElementChild
			color = cached.color
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
		}
		yield
		this.applySize(node, this.parent)
		yield
		this.addClass(this.displayPromise, 'sized')
		const hslString = await this.use(this.displayPromise, node, erase, color)
		yield
		this.parent.style.color = hslString
		resolve({ node, erase, color })
	}

	async * runFull(resolve) {
		yield
		const { node, erase, color } = await this.displayPromise
		yield
		if (!this.wasInCache) {
			await this.alphabetize(this.fullPromise, node)
			yield
			this.cache(this.name, node, erase, color)
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
		if (width < height)
			parent.style.setProperty('--bound-width', (.9 * SIZE_FACTOR * width / 10) + '%')
		else
			parent.style.setProperty('--bound-height', (.9 * SIZE_FACTOR * height / 10) + '%')
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

	cache(name, node, erase, color) {
		this.IndexedDBManager.saveGraph({ name, node, erase, color })
	}

	alphabetize(idlePromise, node) {
		const alphabetizer = new TextToAlphabet(node, this.name)

		idlePromise.addUrgentListener(alphabetizer.finish)

		return alphabetizer
	}

	process(parentIdlePromise, node, parent) {

		const idlePromise = new IdlePromise(async function* (resolve) {
			yield
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

	makeStatic({ node }) {
		return new IdlePromise((async function* (resolve, reject) {
			const src = `/static/graphs_${this.name}.jpg`
			const jpegBlobUploader = new SWJpegBlobUploader()

			yield
			const cached = await jpegBlobUploader.has(src)

			yield
			const img = document.createElement('img')
			img.setAttribute('slot', 'static')

			const loadPromise = new Promise(resolve => {
				img.addEventListener('load', resolve, { once: true })
				img.addEventListener('error', reject, { once: true })
			})

			if (cached) {
				img.src = src
			} else {
				yield
				const buffer = await svgToImageBlob(node)
				yield
				jpegBlobUploader.put(src, buffer, src => img.src = src)
			}

			await loadPromise

			yield
			this.parent.appendChild(img)
			this.parent.classList.add('static-img')
			resolve()
		}).bind(this))
	}
}