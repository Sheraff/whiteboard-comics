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
				

				await card.ReadyNode
				card.eraseAnim.toggle()
				await card.eraseAnim

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

				await Promise.all([
					card.Alphabet.promise,
					new Promise(resolve => animation.onfinish = resolve)
				])

				card.SVGAnim.toggle()

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

		return card.animate([
			{ transform: `translate3d(${before.left - after.left}px, ${before.top - after.top}px, 0) scale(${scaleX}, ${scaleY})` },
			{ transform: 'none' }
		], { duration: 2000 })
	}
}