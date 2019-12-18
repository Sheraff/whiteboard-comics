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
			requestAnimationFrame(() => {
				if(card.dataset.top)
					this.removeChild(this.placeholder)
				const before = card.getBoundingClientRect()
				card.dataset.top = !card.dataset.top
				const after = card.getBoundingClientRect()
				if(card.dataset.top)
					this.insertBefore(this.placeholder, card)
					
				const animation = card.animate([
					{ transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${before.width / after.width}, ${before.height / after.height})` },
					{ transform: 'none' }
				], { duration: 500 })
				Promise.all([
					card.ReadyNode,
					card.Alphabet.promise,
					animation
				]).then(() => {
					card.SVGAnim.toggle()
				})
			})
		}
	}
}