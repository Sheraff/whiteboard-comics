import Routing from '../modules/Routing.js'

export default class Grid extends HTMLElement {
	constructor() {
		super()
		this.cards = new Map()
		this.querySelectorAll('svg-card').forEach(async card => {
			const name = card.getAttribute('name')
			this.cards.set(name, card)

			await customElements.whenDefined('svg-card')
			card.addEventListener('click', this.getOnClick(card))

			// temporarily set <text> fill to opaque white to allow for selection
			// TODO: to allow for selection, we have to make SVG display (when an img could otherwise be enough) which causes weird rendering glitch
			card.addEventListener('mousedown', () => card.classList.add('selecting'))
			card.addEventListener('mouseup', () => card.classList.remove('selecting'))
			card.addEventListener('mouseout', () => card.classList.remove('selecting'))
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
		if (name === 'current' && oldValue !== value)
			this.changeCurrent(value, oldValue)
	}

	static get observedAttributes() { return ['current'] }

	getOnClick(card) {
		return () => {
			// check that click isn't just selecting text
			const { type } = document.getSelection()
			if(type === 'Range')
				return

			if (this.attributes.current && this.attributes.current.value === card.attributes.name.value) {
				this.removeAttribute('current')
				this.routing.push()
			} else {
				this.setAttribute('current', card.attributes.name.value)
				this.routing.push(card.attributes.name.value)
			}
		}
	}

	async changeCurrent(value, oldValue) {
		if (value) {
			const card = this.cards.get(value)
			await this.popCardOut(card)
			await card.SVGAnim.play()
			delete card.dataset.live
		} else {
			const card = this.cards.get(oldValue)
			await this.pullCardIn(card)
			await card.SVGAnim.play()
			delete card.dataset.live
		}
	}

	async popCardOut(card) {
		await this.transitionCard(
			card,
			() => {
				card.dataset.live = true
				delete card.dataset.top
				card.classList.remove('shadow-zoom-out')
			},
			() => {
				card.dataset.top = true
				card.dataset.last = true
				this.placeholder.style.color = card.style.color
				this.placeholder[card.attributes.featured ? 'setAttribute' : 'removeAttribute']('featured', true)
				// card.insertAdjacentElement('afterend', this.placeholder)
				this.insertBefore(this.placeholder, card)
				this.placeholder.style.setProperty('--shadow-duration', `${Math.max(300, card.eraseAnim.duration - 300)}ms`)
				this.placeholder.style.setProperty('--shadow-delay', '300ms')
				this.placeholder.classList.add('shadow-zoom-in')
			},
			() => {
				card.classList.add('visible-meta')
			}
		)
	}

	async pullCardIn(card) {
		await this.transitionCard(
			card,
			() => {
				this.removeChild(this.placeholder)
				this.placeholder.classList.remove('shadow-zoom-in')
				card.dataset.top = true
				delete card.dataset.live
				card.classList.remove('visible-meta')
			},
			() => {
				card.dataset.live = true
				delete card.dataset.top
				card.style.setProperty('--shadow-duration', `${Math.max(300, card.eraseAnim.duration - 300)}ms`)
				card.style.setProperty('--shadow-delay', '300ms')
				card.classList.add('shadow-zoom-out')
			},
			() => {
				delete card.dataset.last
			}
		)
	}

	async swapCards(oldCard, newCard) {

	}

	async transitionCard(card, before, toggle, after) {
		if (!card.SVGAnim)
			await card.ReadyNode
		else if (card.SVGAnim.playing)
			card.SVGAnim.pause()

		await card.eraseAnim.idlePromise

		await new Promise(requestAnimationFrame)

		before()

		const transition = this.createTransition(card, toggle, {
			delay: 300,
			duration: Math.max(300, card.eraseAnim.duration - 300),
		})

		const animation = card.eraseAnim.play()
			.then(() => card.SVGAnim.idlePromise.finish())
			.then(() => card.SVGAnim.prepare())
			.then(() => card.eraseAnim.prepare())

		await transition
		await animation
		await card.SVGAnim.idlePromise

		if (after instanceof Function)
			after()
	}

	createTransition(card, transformation, options = {}) {
		const backgroundBeforeState = card.background.getBoundingClientRect()
		const svgBeforeState = card.svg.getBoundingClientRect()

		transformation()

		const backgroundAfterState = card.background.getBoundingClientRect()
		const svgAfterState = card.svg.getBoundingClientRect()

		const backgroundOffsetX = backgroundBeforeState.left - backgroundAfterState.left
		const backgroundOffsetY = backgroundBeforeState.top - backgroundAfterState.top
		const backgroundScaleX = backgroundBeforeState.width / backgroundAfterState.width
		const backgroundScaleY = backgroundBeforeState.height / backgroundAfterState.height
		const backgroundKeyframe = `translate3d(${backgroundOffsetX}px, ${backgroundOffsetY}px, 0) scale(${backgroundScaleX}, ${backgroundScaleY})`

		const svgOffsetX = (svgBeforeState.right + svgBeforeState.left) / 2 - (svgAfterState.right + svgAfterState.left) / 2
		const svgOffsetY = (svgBeforeState.bottom + svgBeforeState.top) / 2 - (svgAfterState.bottom + svgAfterState.top) / 2
		const contentRatio = card.dimensions.width / card.dimensions.height
		const boxRatioBefore = svgBeforeState.width / svgBeforeState.height
		const boxRatioAfter = svgAfterState.width / svgAfterState.height
		let svgScale
		if (boxRatioBefore > contentRatio && boxRatioAfter > contentRatio)
			svgScale = svgBeforeState.height / svgAfterState.height
		else if (boxRatioBefore > contentRatio && boxRatioAfter < contentRatio)
			svgScale = contentRatio * svgBeforeState.height / svgAfterState.width
		else if (boxRatioBefore < contentRatio && boxRatioAfter > contentRatio)
			svgScale = svgBeforeState.width / svgAfterState.height / contentRatio
		else if (boxRatioBefore < contentRatio && boxRatioAfter < contentRatio)
			svgScale = svgBeforeState.width / svgAfterState.width
		const svgKeyframe = `translate3d(${svgOffsetX}px, ${svgOffsetY}px, 0) scale(${svgScale})`

		const transitionOptions = Object.assign({
			duration: 1000,
			easing: 'cubic-bezier(.69,.01,.88,.65)',
			fill: 'backwards',
		}, options)

		const backgroundTransition = card.background.animate([
			{ transform: backgroundKeyframe },
			{ transform: 'none' }
		], transitionOptions)
		const mainSVGTransition = card.svg.animate([
			{ transform: svgKeyframe },
			{ transform: 'none' }
		], transitionOptions)
		const eraseSVGTransition = card.erase.animate([
			{ transform: svgKeyframe },
			{ transform: 'none' }
		], transitionOptions)

		return Promise.all([
			new Promise(resolve => backgroundTransition.onfinish = resolve),
			new Promise(resolve => mainSVGTransition.onfinish = resolve),
			new Promise(resolve => eraseSVGTransition.onfinish = resolve),
		])
	}
}