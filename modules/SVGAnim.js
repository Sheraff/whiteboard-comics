import extendSVG from './extendSVG.js'

export default class SVGAnim {
	constructor(svg) {
		extendSVG()
		this.svg = svg
		this.playing = false
		this.paused = false
	}
	
	async play() {
		this.playing = true
		this.promise = new Promise(resolve => this.resolve = resolve)
		this.iterate(SVGAnim.prepare)
		await this.iterate(this.animate.bind(this))
		this.resolve()
		delete this.promise
		this.playing = false
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
		if(this.playing && this.paused)
			this.resume()
		else if(this.playing && !this.paused)
			this.pause()
		else
			this.play()
	}

	reset() {
		delete this.resolve
		delete this.promise
		this.playing = false
		this.paused = false
		this.animation.cancel()
		this.iterate(SVGAnim.resetNode)
	}

	then(resolve) {
		if(this.promise)
			this.promise.then(resolve)
		else
			resolve()
	}

	async iterate(callback, node = this.svg, previous, index) {
		if (node.isText())
			return
		if (!node.isGroup()) {
			await callback(node, previous, index)
		} else {
			for (let index = 0; index < node.children.length; index++) {
				await this.iterate(callback, node.children[index], node, index)
			}
		}
	}

	async animate(node, previous, index) {
		const length = node.getStaticTotalLength()
		node.style.strokeDasharray = `${length} ${length + 1}`
		node.style.opacity = 1
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				this.animation = node.animate({ 
					strokeDashoffset: [length, 0]
				}, {
					duration: SVGAnim.getElementDuration(node, length),
					delay: index === 0 && previous.isGroup() ? 300 : 0,
					endDelay: node.dataset.type === 'text' || length < 75 ? 10 : 300,
					easing: 'ease-out',
					fill: 'backwards'
				})
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
			return length * 2.5 / 5

		return 25 * Math.log(Math.pow(length, 2))
	}
}