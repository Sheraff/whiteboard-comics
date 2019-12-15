import SVGAnim from '/modules/SVGAnim.js'
import ReadyNode from '/modules/ReadySVGNode.js'

/**
 * scenario
 * 
 * 1. promise.all
 * - raw svg > processed svg (first path to top, viewbox resize)
 * - parsed alphabet
 * - loaded font
 * |-> replace text 
 * 
 * 2.
 * - fetch graph data > fill template
 * 
 * promise.all([1, 2])
 * - store to indexedDB
 * 
 * promise.then(1)
 * - compute anim
 * - erase
 * - play
 */

export default class SVGCard extends HTMLElement {

	constructor() {
		super()
		this.ReadyNode = new ReadyNode(this)
		this.SVGAnim = new SVGAnim()
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
	}

	onMouseOver() {
		this.ReadyNode.finish()
	}

}