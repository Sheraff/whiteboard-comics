import extendSVG from './extendSVG.js'
import IdleStack from './IdleStack.js'

export default class SVGAnim {
	constructor(svg) {
		extendSVG()
		this.svg = svg
		this.playing = false
		this.paused = false
		this.prepared = false
		this.prepare = this.prepare.bind(this)

		this.map = new Map()
		this.stack = new IdleStack(() => this.iterate(this.preprocess.bind(this)))

		// TODO: load anim parameters in advance in an IdleStack, store in Map() w/ nodes as keys, .finish() when needed
	}

	async play() {
		if (this.playing)
			await this.reset()
		this.playing = true
		this.promise = new Promise(resolve => this.resolve = resolve)
		if (!this.prepared)
			await this.iterate(SVGAnim.prepare)
		await this.iterate(this.animate.bind(this))
		this.resolve()
		this.reset()
	}

	prepare() {
		this.prepared = true
		return new Promise(async resolve => {
			await this.iterate(SVGAnim.prepare)
			resolve()
		})
	}

	pause() {
		this.paused = true
		this.animation.pause()
	}

	resume() {
		this.paused = false
		this.animation.play()
	}

	toggle() {
		if (this.playing && this.paused)
			this.resume()
		else if (this.playing && !this.paused)
			this.pause()
		else
			this.play()
	}

	async reset() {
		delete this.resolve
		delete this.promise
		this.playing = false
		this.paused = false
		this.prepared = false
		if (this.animation)
			this.animation.cancel()
		await this.iterate(SVGAnim.resetNode)
	}

	then(resolve) {
		if (this.promise)
			this.promise.then(resolve)
		else
			resolve()
	}

	async iterate(callback, node = this.svg, index) {
		if (node.isText())
			return
		if (!node.isGroup()) {
			await callback(node, index)
		} else {
			for (let index = 0; index < node.children.length; index++) {
				await this.iterate(callback, node.children[index], node, index)
			}
		}
	}

	preprocess(node, index) {
		this.stack.next(() => {
			const length = node.getStaticTotalLength()
			node.style.strokeDasharray = `${length} ${length + 1}`
			this.map.set(node, {
				frames: {
					strokeDashoffset: [length, 0],
					...(node.getAttribute('stroke') === '#FFFFFF' && { stroke: ['#F0F0F0', '#FFFFFF'] }),
				},
				options: {
					duration: SVGAnim.getElementDuration(node, length),
					delay: index === 0 ? 300 : 0,
					endDelay: node.dataset.type === 'text' || length < 75 ? 0 : 300,
					easing: 'ease-out',
					fill: 'backwards',
				}
			})
		})
	}

	async animate(node) {
		if (this.paused)
			return

		node.style.opacity = 1
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				const { frames, options } = this.map.get(node)
				this.animation = node.animate(frames, options)
				this.animation.onfinish = resolve
			})
		})
		node.style.strokeDashoffset = 0
	}

	static prepare(node) {
		node.style.opacity = 0
		node.style.transition = 'none'
	}

	static resetNode(node) {
		node.style.opacity = 1
		node.style.strokeDashoffset = 0
	}

	static getElementDuration(node, length) {
		if (node.dataset.type === 'text')
			return length * 2.5 / 4
		if (node.dataset.type === 'erase')
			return 35 * Math.log(Math.pow(length, 2))

		return 25 * Math.log(Math.pow(length, 2))
	}
}