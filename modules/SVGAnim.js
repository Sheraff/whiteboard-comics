import extendSVG from '/modules/extendSVG.js'
extendSVG()

const SVGAnim = {
	
	async play(node) {
		await SVGAnim.iterate(SVGAnim.prepare, node)
		await SVGAnim.iterate(SVGAnim.animate, node)
	},

	async iterate(callback, node, data = {}) {
		if (node.isText())
			return
		if (!node.isGroup()) {
			await callback(node, data)
			data.inGroup = false
		} else {
			data.inGroup = true
			for (let child of node.children) {
				await SVGAnim.iterate(callback, child, data)
			}
		}
	},

	prepare(node) {
		node.style.opacity = 0
		node.style.transition = 'none'
	},

	async animate(node, data) {
		const length = node.getStaticTotalLength()
		node.style.strokeDasharray = `${length} ${length}`
		node.style.opacity = 1
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				const animation = node.animate({ 
					strokeDashoffset: [length, 0]
				}, {
					duration: SVGAnim.getElementDuration(node, length),
					delay: data.inGroup ? 300 : 0,
					endDelay: node.dataset.type === 'text' || length < 75 ? 0 : 300,
					easing: node.dataset.type === 'text' ? 'ease-out' : 'linear',
					fill: 'backwards'
				})
				animation.onfinish = resolve
			})
		})
		node.style.strokeDashoffset = 0
	},

	getElementDuration(node, length) {
		// TODO: improve duration function (some sort of log?)
		let power = 1

		if (node.dataset.type === 'text')
			power = node.dataset.paragraph ? .2 : .4
		else if (node.dataset.type === 'erase')
			power = .5

		return Math.pow(length, power) * 1.2
	}
}

export default SVGAnim