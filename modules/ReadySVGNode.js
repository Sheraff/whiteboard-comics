import IdleNetwork from '/modules/IdleNetwork.js'
import TextToAlphabet from '/modules/TextToAlphabet.js'
import IndexedDBManager from '/modules/IndexedDB.js'
import IdleStack from '/modules/IdleStack.js'

export default class ReadyNode {
	// TODO: is it necessary to `cloneNode`?
	// 	- for the 'in place' changes, w/ raw, alphabet is optimized already
	// 	- for the fetched results, we could just not add them to the DOM until the end (and avoid flashing at ≠ sizes)
	constructor(parent) {
		this.parent = parent
		this.name = this.parent.attributes.name && this.parent.attributes.name.value
		if (!this.name) return

		this.IndexedDBManager = new IndexedDBManager()
		this.IdleNetwork = new IdleNetwork()

		this.finishPromise = new Promise(resolve => this.finishResolve = resolve)
		this.readyPromise = new Promise(resolve => this.readyResolve = resolve)

		// TODO: use ≠ promise triggers for the ≠ steps of the scenario
		//	- on intersectionObserver, trigger up to raw svg
		//	- on mouseOver, trigger up to alphabetized and processed
		//	- on click, trigger all the way

		this.stack = new IdleStack(this.findStep.bind(this))
			.then(this.startFromStep.bind(this))
		
	}

	finish() {
		this.finishResolve()
		return this.readyPromise
	}

	then(resolve) {
		return this.readyPromise.then(resolve)
	}

	async findStep() {
		const cached = await this.IndexedDBManager.getGraph(this.name)
		if (cached) {
			this.stack.next(() => {
				const domparser = new DOMParser()
				const fragment = domparser.parseFromString(cached.node, 'image/svg+xml')
				return ['cached', { cached: fragment.firstElementChild }]
			})
			return
		}
		const raw = this.parent.querySelector('svg')
		if (raw) {
			// const otherDoc = new Document()
			// const clone = raw.cloneNode(true)
			// otherDoc.adoptNode(clone)
			// return ['raw', { raw: clone }]
			return ['raw', { raw }]
		}
		return ['name', {}]
	}

	startFromStep([step, args]) {
		let { raw, cached } = args
		switch (step) {
			case 'name':
				this.stack.then(() => this.fetch(this.name))
				this.stack.then(result => raw = result)
			case 'raw':
				this.stack.then(() => {
					cached = this.process(raw)
				})
				this.stack.then(async () => await this.alphabetize(cached))
				this.stack.then(() => { this.cache(this.name, cached) })
			case 'cached':
				this.stack.then(() => requestAnimationFrame(() => this.parent.classList.add('alphabetized')))
				this.stack.then(async () => await this.use(cached))
		}
	}

	async use(node) {
		const previous = this.parent.querySelector('svg')
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				if (previous)
					this.parent.replaceChild(node, previous)
				else
					this.parent.appendChild(node)
				resolve()
			})
		})
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

		// find and reorder "erase"
		this.erase = node.firstElementChild
		this.erase.dataset.erase = true
		node.appendChild(this.erase)

		return node
	}

	fetch(name) {
		let idleRequestId
		const graphURL = `/graphs/graphs_${name}.svg`
		this.stack.next(async () => await Promise.race([
			new Promise(resolve => {
				idleRequestId = this.IdleNetwork.requestIdleNetwork(graphURL, resolve)
			}),
			new Promise(resolve => this.finishPromise.then(async () => {
				const cancelable = this.IdleNetwork.cancelIdleNetwork(idleRequestId)
				if (cancelable)
					resolve(await fetch(graphURL))
			}))
		]))
			.next(response => response.text())
			.next(fetched => {
				const domparser = new DOMParser()
				const fragment = domparser.parseFromString(fetched, 'image/svg+xml')
				const raw = fragment.firstElementChild
				// this.parent.appendChild(raw.cloneNode(true))
				return raw
			})
	}
}