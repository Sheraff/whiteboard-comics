import Routing from '../modules/Routing.js'

export default class Grid extends HTMLElement {
	constructor() {
		super()
		this.cards = new Map()
		this.querySelectorAll('svg-card').forEach(async card => {
			const name = card.getAttribute('name')
			this.cards.set(name, card)

			await customElements.whenDefined('svg-card')
			card.background.addEventListener('click', this.getOnClick(card))
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

	async changeCurrent(value, oldValue) {
		if(value) {
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
		if(!card.SVGAnim)
			await card.ReadyNode
		else if(card.SVGAnim.playing)
			card.SVGAnim.pause()

		await card.eraseAnim.idlePromise

		await new Promise(resolve => requestAnimationFrame(async () => {

			const transition = this.createTransition(card, () => {
				card.dataset.live = true
				card.dataset.top = true
				card.dataset.last = true

				this.placeholder.style.color = card.style.color
				this.placeholder[card.attributes.featured ? 'setAttribute' : 'removeAttribute']('featured', true)
				this.insertBefore(this.placeholder, card)
			})

			await Promise.all([
				transition,
				card.eraseAnim.play()
					.then(() => card.SVGAnim.idlePromise.finish())
					.then(() => card.SVGAnim.prepare())
					.then(() => card.eraseAnim.prepare()),
				card.SVGAnim.idlePromise,
			])

			resolve()
		}))
	}

	async pullCardIn(card) {
		if(!card.SVGAnim)
			await card.ReadyNode
		else if(card.SVGAnim.playing)
			card.SVGAnim.pause()

		await card.eraseAnim.idlePromise

		await new Promise(resolve => requestAnimationFrame(async () => {
			this.removeChild(this.placeholder)

			const transition = this.createTransition(card, () => {
				card.dataset.live = true
				delete card.dataset.top
			})

			await Promise.all([
				transition,
				card.eraseAnim.play()
					.then(() => card.SVGAnim.idlePromise.finish())
					.then(() => card.SVGAnim.prepare())
					.then(() => card.eraseAnim.prepare()),
				card.SVGAnim.idlePromise,
			])

			delete card.dataset.last

			resolve()
		}))
	}

	async swapCards(oldCard, newCard) {

	}

	createTransition(card, transformation) {
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

		const svgOffsetX = svgBeforeState.left - svgAfterState.left
		const svgOffsetY = svgBeforeState.top - svgAfterState.top
		const contentRatio = card.dimensions.width / card.dimensions.height
		const boxRatioBefore = svgBeforeState.width / svgBeforeState.height
		const boxRatioAfter = svgAfterState.width / svgAfterState.height
		let svgScale
		if(boxRatioBefore > contentRatio && boxRatioAfter > contentRatio)
			svgScale = svgBeforeState.height / svgAfterState.height
		else if(boxRatioBefore > contentRatio && boxRatioAfter < contentRatio)
			svgScale = contentRatio * svgBeforeState.height / svgAfterState.width
		else if(boxRatioBefore < contentRatio && boxRatioAfter > contentRatio)
			svgScale = svgBeforeState.width / svgAfterState.height / contentRatio
		else if(boxRatioBefore < contentRatio && boxRatioAfter < contentRatio)
			svgScale = svgBeforeState.width / svgAfterState.width
		const svgKeyframe = `translate3d(${svgOffsetX}px, ${svgOffsetY}px, 0) scale(${svgScale})`

		const transitionOptions = { duration: 1000 }

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