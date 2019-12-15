import IdleNetwork from '/modules/IdleNetwork.js'
import TextToAlphabet from '/modules/TextToAlphabet.js'
import IndexedDBManager from '/modules/IndexedDB.js'

export default class ReadyNode {
	constructor(parent) {
		this.parent = parent
		this.IndexedDBManager = new IndexedDBManager()
		this.IdleNetwork = new IdleNetwork()

		this.finishPromise = new Promise(resolve => this.finishResolve = resolve)
		this.readyPromise = new Promise(resolve => this.readyResolve = resolve)

		this.findStep()
	}

	finish() {
		this.finishResolve()
		return this.readyPromise
	}

	then(resolve) {
		return this.readyPromise.then(resolve)
	}

	async findStep() {
		const name = this.parent.attributes.name && this.parent.attributes.name.value

		if (!name)
			return

		const cached = await this.IndexedDBManager.getGraph(name)
		if (cached) {
			const domparser = new DOMParser()
			const fragment = domparser.parseFromString(cached.node, 'image/svg+xml')
			return await this.startFromStep('cached', { cached: fragment.firstElementChild, name })
		}
		const raw = this.parent.querySelector('svg')
		if (raw)
			return await this.startFromStep('raw', { raw, name })

		return await this.startFromStep('named', { name })
	}

	startFromStep(step, args) {
		let { name, raw, cached } = args
		return new Promise(async resolve => {
			switch (step) {
				case 'named':
					raw = await this.fetch(name)
				case 'raw':
					cached = await this.process(raw)
					await this.alphabetize(cached)
					this.cache(name, cached)
				case 'cached':
					this.parent.classList.add('alphabetized')
					await this.use(cached)
				case 'ready':
					await resolve()
			}
		})
	}

	use(node) {
		const previous = this.parent.querySelector('svg')
		if (previous)
			this.parent.replaceChild(node, previous)
		else
			this.parent.appendChild(node)
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
		.then(fetched => {
			const domparser = new DOMParser()
			const fragment = domparser.parseFromString(fetched, 'image/svg+xml')
			const raw = fragment.firstElementChild
			this.parent.appendChild(fragment.firstElementChild)
			console.log(name, raw)
			return raw
		})
	}
}