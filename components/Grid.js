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
			requestAnimationFrame(async () => {
				if(card.SVGAnim.playing)
					card.SVGAnim.pause()

				await card.ReadyNode
				card.eraseAnim.play()
				await card.eraseAnim.promise

				const animation = await this.toggleAnimation(card, () => {
					if (card.dataset.top)
						this.removeChild(this.placeholder)
					if (card.dataset.top)
						delete card.dataset.top
					else
						card.dataset.top = true
					if (card.dataset.top)
						this.insertBefore(this.placeholder, card)
				})
				
				if (this.lastPlayed && this.lastPlayed !== card)
					delete this.lastPlayed.dataset['lastPlayed']
				this.lastPlayed = card
				this.lastPlayed.dataset['lastPlayed'] = true

				await Promise.all([
					card.Alphabet.promise,
					new Promise(resolve => animation.onfinish = resolve),
					card.SVGAnim.prepare().then(card.eraseAnim.prepare),
				])

				card.SVGAnim.play()

			})
		}
	}

	async toggleAnimation(card, callback) {
		const before = card.getBoundingClientRect()
		// await new Promise(resolve => requestAnimationFrame(resolve))
		callback()
		const after = card.getBoundingClientRect() // TODO: might not need this bc we can know it beforehand

		const scaleX = before.width / after.width
		const scaleY = before.height / after.height

		return card.animate([
			{ transform: `translate3d(${before.left - after.left}px, ${before.top - after.top}px, 0) scale(${scaleX}, ${scaleY})` },
			{ transform: 'none' }
		], { duration: 1000, easing: 'cubic-bezier(.98,-0.56,.83,.67)' })
		// ], { duration: 1000, easing: 'ease-in' })
	}
}