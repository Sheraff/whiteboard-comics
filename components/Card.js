import SVGAnim from '../modules/SVGAnim.js'
import ReadyNode from '../modules/ReadySVGNode.js'
import Alphabet from '../modules/Alphabet.js'

export default class SVGCard extends HTMLElement {

	constructor() {
		super()
		this.ReadyNode = new ReadyNode(this)
		this.Alphabet = new Alphabet()
	}

	connectedCallback() {
		const template = document.getElementById('svg-card');
		const fragment = document.importNode(template.content, true);
		this.attachShadow({ mode: 'open' })
		this.shadowRoot.appendChild(fragment)

		document.fonts.load('1em Permanent Marker').then(() => this.classList.add('font-loaded'))

		this.ReadyNode.then(() => {
			if (this.intersectionObserver) {
				this.intersectionObserver.disconnect()
				delete this.intersectionObserver
			}
			this.removeEventListener('mouseover', this.onMouseOver)
		})

		// if mouse over, immediately request playability in case of click
		this.addEventListener('mouseover', this.onMouseOver, { once: true })

		// if in viewport, immediately request something to display
		this.intersectionObserver = new IntersectionObserver(([intersection]) => {
			if (!intersection.isIntersecting)
				return
			this.intersectionObserver.disconnect()
			delete this.intersectionObserver
			this.ReadyNode.display()
		})
		this.intersectionObserver.observe(this);

		this.addEventListener('click', this.onClick)
	}

	onMouseOver() {
		this.ReadyNode.finish()
	}

	onClick() {
		Promise.all([
			this.ReadyNode,
			this.Alphabet.promise
		]).then(() => {
			this.svg = this.querySelector('svg[data-main]')
			SVGAnim.play(this.svg)
		})
	}

}