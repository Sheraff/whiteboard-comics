export default class Grid extends HTMLElement {
	constructor() {
		super()
		this.cards = this.querySelectorAll('svg-card')
		this.cards.forEach(card => card.addEventListener('click', this.getOnClick(card)))
		this.placeholder = document.createElement('div')
		this.placeholder.classList.add('svg-card')
	}

	getOnClick(card) {
		return () => {
			if (this.lastPlayed && this.lastPlayed !== card)
				delete this.lastPlayed.dataset['lastPlayed']
			this.lastPlayed = card
			this.lastPlayed.dataset['lastPlayed'] = true
			requestAnimationFrame(async () => {
				if (card.dataset.top) {
					this.removeChild(this.placeholder)
				}
				const animation = await this.toggleAnimation(card, () => {
					if (card.dataset.top)
						delete card.dataset.top
					else
						card.dataset.top = true
				})
				if (card.dataset.top) {
					this.insertBefore(this.placeholder, card)
				}

				Promise.all([
					card.ReadyNode,
					card.Alphabet.promise,
					new Promise(resolve => animation.onfinish = resolve)
				]).then(() => {
					// card.SVGAnim.toggle()
				})
			})
		}
	}

	async toggleAnimation(card, callback) {
		const before = card.getBoundingClientRect()
		await new Promise(resolve => requestAnimationFrame(resolve))
		callback()
		const after = card.getBoundingClientRect()

		const scaleX = before.width / after.width
		const scaleY = before.height / after.height

		let svgScaleCompensation
		if(card.svg.dataset.bound === 'width') {
			svgScaleCompensation = `scaleX(${1 / scaleX})`
		} else {
			svgScaleCompensation = `scaleY(${1 / scaleY})`
		}

		card.svg.animate([
			{ transform: `translate(-50%, -50%) ${svgScaleCompensation}` },
			{ transform: 'translate(-50%, -50%)' }
		], { duration: 2000 })

		return card.animate([
			{ transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${scaleX}, ${scaleY})` },
			{ transform: 'none' }
		], { duration: 2000 })
	}
}