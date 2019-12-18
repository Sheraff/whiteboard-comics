import IdleNetwork from './IdleNetwork.js'
import TextToAlphabet from './TextToAlphabet.js'
import IndexedDBManager from './IndexedDB.js'
import IdleStack from './IdleStack.js'

export default class ReadyNode {
	constructor(parent) {
		this.parent = parent
		this.name = this.parent.attributes.name && this.parent.attributes.name.value
		if (!this.name) return

		this.IndexedDBManager = new IndexedDBManager()
		this.IdleNetwork = new IdleNetwork()

		this.displayPromise = new Promise(resolve => this.displayResolve = resolve)
		this.readyPromise = new Promise(resolve => this.readyResolve = resolve)

		this.stacks = []
		this.stacks.push(
			new IdleStack(this.findStep.bind(this))
				.then(this.startFromStep.bind(this))
		)
	}

	display() {
		return this.displayPromise
			.then(isCached => {
				if (isCached)
					return this.stacks[0].finish()
				return this.stacks[0].finish()
					.then(() => this.stacks[1].finish())
			})
	}

	async finish() {
		for (let i = 0; i < this.stacks.length; i++) {
			await this.stacks[i].finish()
		}
	}

	then(resolve) {
		return this.readyPromise.then(resolve)
	}

	async findStep() {
		const cached = await this.IndexedDBManager.getGraph(this.name)
		this.displayResolve(!!cached)
		if (cached) {
			this.stacks[0].next(() => {
				const domparser = new DOMParser()
				let fragment, eraseFragment
				this.stacks[0].next(() => { fragment = domparser.parseFromString(cached.node, 'image/svg+xml') }, 40)
				this.stacks[0].next(() => { eraseFragment = domparser.parseFromString(cached.erase, 'image/svg+xml') })
				this.stacks[0].next((_, onFinish) => this.addClass(this.stacks[0], onFinish, 'sized'))
				this.stacks[0].next(() => this.use(fragment.firstElementChild, eraseFragment.firstElementChild))
				this.stacks[0].next(() => (['cached', {
					cached: fragment.firstElementChild,
					erase: eraseFragment.firstElementChild
				}]))
			})
			return
		}
		const raw = this.parent.querySelector('svg')
		if (raw)
			return ['raw', { raw }]
		return ['name', {}]
	}

	startFromStep([step, args]) {
		let { raw, cached, erase } = args
		this.stacks.push(new IdleStack(async () => await this.stacks[0].promise))
		switch (step) {
			case 'name':
				this.stacks[1].then(() => this.fetch(this.name))
				this.stacks[1].then(result => raw = result)
			case 'raw':
				this.stacks[1].then(() => {
					const result = this.process(raw)
					cached = result.node
					erase = result.erase
				})
				this.stacks[1].then((_, onFinish) => this.addClass(this.stacks[1], onFinish, 'sized'))
				this.stacks[1].then(() => { this.use(cached, erase) })
				// ASAP up to previous line on `display()`
				this.stacks.push(new IdleStack(async () => await this.stacks[1].promise))
				this.stacks[2].then(async (_, onFinish) => await this.alphabetize(onFinish, cached))
				this.stacks[2].then(() => { this.cache(this.name, cached, erase) })
			case 'cached':
				this.stacks[this.stacks.length - 1].then((_, onFinish) => this.addClass(this.stacks[this.stacks.length - 1], onFinish, 'alphabetized'))
				this.stacks[this.stacks.length - 1].then(this.readyResolve)
				// ASAP up to previous line on `finish()`
		}
	}

	async use(node, erase) {
		const previous = this.parent.querySelector('svg')
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				this.parent.appendChild(erase)
				if (previous)
					this.parent.replaceChild(node, previous)
				else
					this.parent.appendChild(node)
				resolve()
			})
		})
	}


	cache(name, node, erase) {
		this.IndexedDBManager.saveGraph({ name, node, erase })
	}

	async alphabetize(onFinish, node) {
		const alphabetizer = new TextToAlphabet(node)
		if (this.stacks[2].isFinishing) {
			await alphabetizer.finish()
			return node
		}
		await Promise.race([
			alphabetizer.promise,
			new Promise(resolve => onFinish(async () => {
				alphabetizer.finish().then(resolve)
			}))
		])
		return node
	}

	addClass(stack, onFinish, className) {
		if (stack.isFinishing)
			return this.parent.classList.add(className)
		let idleRequestId = requestAnimationFrame(() => this.parent.classList.add(className))

		onFinish(async () => {
			cancelIdleNetwork(idleRequestId)
			this.parent.classList.add(className)
			resolve()
		})
	}

	process(node) {
		// resize
		const SIZE_FACTOR = 1.4 // this formula assumes a max SVG size of 1000x1000px in Illustrator
		const [, , width, height] = node.getAttribute('viewBox').split(' ')
		if (width < height)
			node.style.width = (.9 * SIZE_FACTOR * width / 10) + '%'
		else
			node.style.height = (.9 * SIZE_FACTOR * height / 10) + '%'

		// find and extract "erase"
		const erase = node.firstElementChild
		erase.dataset.type = 'erase'
		const eraseSlot = node.cloneNode(false)
		eraseSlot.setAttribute('slot', 'erase')
		eraseSlot.appendChild(erase)

		node.dataset.main = true

		return { node, erase: eraseSlot }
	}

	fetch(name) {
		let idleRequestId
		const graphURL = `/graphs/graphs_${name}.svg`
		this.stacks[1].next(async (_, onFinish) => {
			if (this.stacks[1].isFinishing)
				return await this.IdleNetwork.race(graphURL)
			return await Promise.race([
				new Promise(resolve => {
					idleRequestId = this.IdleNetwork.requestIdleNetwork(graphURL, resolve)
				}),
				new Promise(resolve => onFinish(async () => {
					const cancelable = this.IdleNetwork.cancelIdleNetwork(idleRequestId)
					if (cancelable)
						resolve(await this.IdleNetwork.race(graphURL))
				}))
			])
		})
			.next(response => response.text())
			.next(fetched => {
				const domparser = new DOMParser()
				const fragment = domparser.parseFromString(fetched, 'image/svg+xml')
				const raw = fragment.firstElementChild
				return raw
			})
	}
}