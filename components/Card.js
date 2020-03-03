import SVGAnim from '../modules/SVGAnim.js'
import ReadyNode from '../modules/ReadySVGNode.js'
import Alphabet from '../modules/Alphabet.js'

export default class Card extends HTMLElement {

	constructor() {
		super()
		this.ReadyNode = new ReadyNode(this)
		this.Alphabet = new Alphabet()
		this.hover = this.hover.bind(this)
	}

	connectedCallback() {
		const template = document.getElementById('svg-card')
		const fragment = document.importNode(template.content, true)
		this.attachShadow({ mode: 'open' })
		this.shadowRoot.appendChild(fragment)

		document.fonts.load('1em Permanent Marker').then(() => this.classList.add('font-loaded'))

		this.ReadyNode.then(() => {
			this.svg = this.querySelector('svg[data-main]')
			this.erase = this.querySelector('svg[slot="erase"]')
			this.SVGAnim = new SVGAnim(this.svg)
			this.eraseAnim = new SVGAnim(this.erase)

			if(this.ReadyNode.urgent)
				this.eraseAnim.idlePromise.finish()

			if (this.intersectionObserver) {
				this.intersectionObserver.disconnect()
				delete this.intersectionObserver
			}
			
			this.removeEventListener('mouseover', this.hover)
		})

		// if mouse over, immediately request playability in case of click
		this.addEventListener('mouseover', this.hover, { once: true })

		// if in viewport, immediately request something to display
		this.intersectionObserver = new IntersectionObserver(([intersection]) => {
			if (!intersection.isIntersecting)
				return
			this.intersectionObserver.disconnect()
			delete this.intersectionObserver
			this.ReadyNode.display()
		})
		this.intersectionObserver.observe(this)
	}

	hover() {
		this.ReadyNode.finish()
		this.ReadyNode.then(() => {
			if(this.eraseAnim)
				this.eraseAnim.idlePromise.finish()
		})
	}
}