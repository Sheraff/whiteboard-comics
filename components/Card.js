import { requestIdleNetwork, cancelIdleNetwork } from '/modules/requestIdleNetwork.js'
import IdleStack from '/modules/IdleStack.js'
import SVGAnim from '/modules/SVGAnim.js'
import IndexedDBManager from '/modules/IndexedDB.js'

/**
 * scenario
 * - raw svg > processed svg
 * - parsed alphabet
 * - loaded font
 * |-> replace text
 * - compute anim
 * - erase
 * - play
 */

export default class SVGCard extends HTMLElement {
	constructor() {
		super()
		this.SVGAnim = new SVGAnim()
		this.IndexedDBManager = new IndexedDBManager()
	}

	connectedCallback() {


		const template = document.getElementById('svg-card');
		const fragment = document.importNode(template.content, true);
		this.attachShadow({ mode: 'open' })
		this.shadowRoot.appendChild(fragment)
		this.$svg = this.querySelector('svg')
		if(this.attributes.name)
			this.name = this.attributes.name.value

		// get raw SVG
		if (!this.$svg && this.hasAttribute('name')) {
			// request whenever there is down time in the network
			this.svgRequestId = requestIdleNetwork(`/graphs/graphs_${this.name}.svg`, async svg => {
				if (this.intersectionObserver) {
					this.intersectionObserver.disconnect()
					delete this.intersectionObserver
				}
				this.setInnerSvg(await svg.text())
			})
			// if in viewport, request immediately
			this.intersectionObserver = new IntersectionObserver(([intersection]) => {
				if (!intersection.isIntersecting)
					return
				this.intersectionObserver.disconnect()
				delete this.intersectionObserver
				const isCanceled = cancelIdleNetwork(this.svgRequestId)
				if (!this.$svg && isCanceled)
					fetch(`/graphs/graphs_${this.name}.svg`).then(async svg => this.setInnerSvg(await svg.text()))
			})
			this.intersectionObserver.observe(this);
		}

		// get font
		document.fonts.load('1em Permanent Marker').then(() => {
			this.classList.add('font-loaded')
		})

		//
		this.classList.add('web-component')

	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			default:
				console.warn(`No handle defined for ${name} change`)
				break
		}
	}

	set $svg(node) {
		this._svg = node
		if(node) {
			this.dataset.viewBox = node.getAttribute('viewBox')
			this.dataset.raw = true
			if(this.name)
				this.IndexedDBManager.saveGraph({
					name: this.name,
					node 
				})
		}
	}

	get $svg() {
		return this._svg
	}

	setInnerSvg(serializedHTML) {
		const range = new Range()
		const fragment = range.createContextualFragment(serializedHTML)
		const node = this.processRawSvgNode(fragment.firstElementChild)
		if (this.$svg)
			this.replaceChild(node, this.$svg)
		else
			this.appendChild(node)
		this.$svg = node
	}

	processRawSvgNode(node) {
		const SIZE_FACTOR = 1.4 // this formula assumes a max SVG size of 1000x1000px in Illustrator
		const viewbox = node.getAttribute('viewBox').split(' ')
		const svgbox = node.getBoundingClientRect()
		if (svgbox.width < svgbox.height)
			node.style.width = (.9 * SIZE_FACTOR * viewbox[2] / 10) + '%'
		else
			node.style.height = (.9 * SIZE_FACTOR * viewbox[3] / 10) + '%'
		return node
	}
}