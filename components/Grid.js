import Routing from '../modules/Routing.js'

export default class Grid extends HTMLElement {
	constructor() {
		super()
		this.cards = new Map()
		this.querySelectorAll('svg-card').forEach(card => {
			const name = card.getAttribute('name')
			this.cards.set(name, card)
			card.addEventListener('click', this.getOnClick(card))
		})
		this.placeholder = document.createElement('div')
		this.placeholder.classList.add('svg-card')

		this.routing = new Routing(this.attributes.current && this.attributes.current.value)
		this.routing.addChangeListener((name = '') => {
			this.setAttribute('current', name)
		})

		// TODO: add states for transitions (.opening / .closing) and don't apply box-shadows while in transition
		// TODO: don't apply box-shadow while on top
		// TODO: placeholder should carry box-shadows of card it replaces
	}

	attributeChangedCallback(name, oldValue, value) {
		if(name === 'current' && oldValue !== value)
			this.changeCurrent(value, oldValue)
	}

	static get observedAttributes() { return ['current'] }

	getOnClick(card) {
		return () => {
			if(this.attributes.current && this.attributes.current.value === card.attributes.name.value) {
				this.setAttribute('current', '')
				this.routing.push()
			} else {
				this.setAttribute('current', card.attributes.name.value)
				this.routing.push(card.attributes.name.value)
			}
		}
	}

	changeCurrent(value, oldValue) {
		if(value)
			this.setCardAsCurrent(this.cards.get(value))
		else
			this.setCardAsCurrent(this.cards.get(oldValue))

		// change from oldValue to /
		// change from / to value
		// change from oldValue to value
	}

	async setCardAsCurrent(card) {
		await card.ReadyNode
		requestAnimationFrame(async () => {
			if(card.SVGAnim.playing)
				card.SVGAnim.pause()

			card.dataset.live = true

			await card.ReadyNode
			await card.eraseAnim.idlePromise
			card.eraseAnim.play()
			await card.eraseAnim.promise

			const animation = this.toggleAnimation(card, () => {
				if (card.dataset.top)
					this.removeChild(this.placeholder)
				if (card.dataset.top)
					delete card.dataset.top
				else
					card.dataset.top = true
				if (card.dataset.top) {
					this.placeholder.style.color = card.style.color
					this.placeholder[card.attributes.featured ? 'setAttribute' : 'removeAttribute']('featured', true)
					this.insertBefore(this.placeholder, card)
				}
			})
			
			if (this.lastPlayed && this.lastPlayed !== card)
				delete this.lastPlayed.dataset['lastPlayed']
			this.lastPlayed = card
			this.lastPlayed.dataset['lastPlayed'] = true

			await Promise.all([
				new Promise(resolve => animation.onfinish = resolve)
					.then(() => card.SVGAnim.idlePromise.finish()),
				card.SVGAnim.idlePromise
					.then(() => card.SVGAnim.prepare())
					.then(() => card.eraseAnim.prepare()),
			])

			card.SVGAnim.play()
				.then(() => delete card.dataset.live)

		})
	}

	toggleAnimation(card, callback) {
		const before = card.getBoundingClientRect()
		callback()
		const after = card.getBoundingClientRect() // TODO: might not need this bc we can know it beforehand

		const scaleX = before.width / after.width
		const scaleY = before.height / after.height

		return card.animate([
			{ transform: `translate3d(${before.left - after.left}px, ${before.top - after.top}px, 0) scale(${scaleX}, ${scaleY})` },
			{ transform: 'none' }
		], { duration: 500 })
		// ], { duration: 1000, easing: 'cubic-bezier(.77,-0.3,.4,1)' })
		// toggle back cubic-bezier(.5,.1,.4,1)
	}
}