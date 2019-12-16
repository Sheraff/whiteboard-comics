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
		node.style.transition = 'none'
		node.style.opacity = 0
	},

	async animate(node) {
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				const length = node.getStaticTotalLength()
				const animation = node.animate([
					{ opacity: 1, strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
					{ opacity: 1, strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 }
				], {
					duration: SVGAnim.getElementDuration(node, length),
					endDelay: node.dataset.type === 'text' ? 0 : 200,
					easing: node.dataset.type === 'text' ? 'ease-out' : 'linear',
					fill: 'both'
				})
				animation.onfinish = resolve
			})
		})
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