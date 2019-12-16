import extendSVG from '/modules/extendSVG.js'
extendSVG()

const SVGAnim = {
	
	async play(node) {
		await SVGAnim.iterate(SVGAnim.prepare, node)
		await SVGAnim.iterate(SVGAnim.animate, node)
	},

	async iterate(callback, node, previous, index) {
		if (node.isText())
			return
		if (!node.isGroup()) {
			await callback(node, previous, index)
		} else {
			for (let index = 0; index < node.children.length; index++) {
				await SVGAnim.iterate(callback, node.children[index], node, index)
			}
		}
	},

	prepare(node) {
		node.style.opacity = 0
		node.style.transition = 'none'
	},

	async animate(node, previous, index) {
		const length = node.getStaticTotalLength()
		node.style.strokeDasharray = `${length} ${length + 1}`
		node.style.opacity = 1
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				const animation = node.animate({ 
					strokeDashoffset: [length, 0]
				}, {
					duration: SVGAnim.getElementDuration(node, length),
					delay: index === 0 && previous.isGroup() ? 300 : 0,
					endDelay: node.dataset.type === 'text' || length < 75 ? 10 : 300,
					easing: 'ease-out',
					fill: 'backwards'
				})
				animation.onfinish = resolve
			})
		})
		node.style.strokeDashoffset = 0
	},

	getElementDuration(node, length) {
		if (node.dataset.type === 'text')
			return length * 2.5 / 5

		return 25 * Math.log(Math.pow(length, 2))
	}
}

export default SVGAnim