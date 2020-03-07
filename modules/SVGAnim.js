import extendSVG from '../functions/extendSVG.js'
import IdlePromise from './IdlePromise.js'

export default class SVGAnim {
	constructor(svg) {
		extendSVG()
		this.svg = svg
		this.playing = false
		this.paused = false
		this.prepared = false
		this.prepare = this.prepare.bind(this)

		this.map = new Map()
		this.idlePromise = new IdlePromise(this.iterateGenerator.bind(this, this.preprocess.bind(this), 20))
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

	async * iterateGenerator(callback, taskDuration = IdlePromise.padding, resolve) {
		let context = { node: this.svg, index: 0 }
		yield
		while (true) {
			const { node, index, parent } = context
			const current = node.children[index]
			if (!current) {
				if (!parent) break
				context = parent
				context.index++
			} else if (current.isText()) {
				context.index++
			} else if (!current.isGroup()) {
				yield taskDuration
				await callback(current, index)
				context.index++
			} else {
				context = {
					node: current,
					index: 0,
					parent: context
				}
			}
		}
		if(resolve)
			resolve()
	}

	async iterate(callback) {
		const iterator = this.iterateGenerator(callback)
		while (true) {
			const { done } = await iterator.next()
			if (done) break
		}
	}

	preprocess(node, index) {
		const length = node.getStaticTotalLength()
		const isEraseStroke = node.getAttribute('stroke') === '#FFFFFF'
		node.style.strokeDasharray = `${length} ${length + 1}`
		this.map.set(node, {
			before: {
				opacity: 1,
			},
			frames: {
				strokeDashoffset: [length, 0],
				...(isEraseStroke && {
					stroke: [
						'#F0F0F0',
						'#FFFFFF',
					]
				}),
			},
			options: {
				duration: SVGAnim.getElementDuration(node, length),
				delay: index === 0 ? 300 : 0,
				endDelay: node.dataset.type === 'text' || length < 75 ? 0 : 300,
				easing: 'ease-out',
				fill: 'backwards',
			},
			after: {
				strokeDashoffset: 0,
			}
		})
	}

	async animate(node) {
		if (this.paused)
			return

		const { frames, options, before, after } = this.map.get(node)
		Object.entries(before).forEach(([key, value]) => node.style[key] = value)
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				this.animation = node.animate(frames, options)
				this.animation.onfinish = resolve
			})
		})
		Object.entries(after).forEach(([key, value]) => node.style[key] = value)
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