import extendSVG from '/modules/extendSVG.js'
extendSVG()

const SVGAnim = {
	
	async play(node) {
		await SVGAnim.iterate(SVGAnim.prepare, node)
		await SVGAnim.iterate(SVGAnim.animate, node)
	},

	async iterate(callback, node) {
		if (node.isText())
			return
		if (!node.isGroup())
			await callback(node)
		else
			for (let child of node.children) {
				await SVGAnim.iterate(callback, child)
			}
	},

	prepare(node) {
		node.style.opacity = 0
		node.style.transition = 'none'
	},

	async animate(node) {
		const length = node.getStaticTotalLength()
		node.style.strokeDasharray = `${length} ${length}`
		node.style.opacity = 1
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				const animation = node.animate({ 
					strokeDashoffset: [length, 0]
				}, {
					duration: SVGAnim.getElementDuration(node, length),
					endDelay: node.dataset.type === 'text' || length < 100 ? 0 : 200,
					easing: node.dataset.type === 'text' ? 'ease-out' : 'linear',
				})
				animation.onfinish = resolve
			})
		})
		node.style.strokeDashoffset = 0
	},

	getElementDuration(node, length) {
		let power = 1

		if (node.dataset.type === 'text')
			power = node.dataset.paragraph ? .2 : .4
		else if (node.dataset.type === 'erase')
			power = .5

		return Math.pow(length, power)
	}
}

export default SVGAnim