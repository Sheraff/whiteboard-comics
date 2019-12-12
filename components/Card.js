import { requestIdleNetwork, cancelIdleNetwork } from '/modules/requestIdleNetwork.js'
import IdleStack from '/modules/IdleStack.js'

export default class SVGCard extends HTMLElement {

	connectedCallback() {
		const template = document.getElementById('svg-card');
		const fragment = document.importNode(template.content, true);
		this.attachShadow({ mode: 'open' })
		this.shadowRoot.appendChild(fragment)
		this.$svg = this.querySelector('svg')

		// get raw SVG
		if (!this.$svg && this.hasAttribute('name')) {
			// request whenever there is down time in the network
			this.svgRequestId = requestIdleNetwork(`/graphs/graphs_${this.attributes.name.value}.svg`, async svg => {
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
					fetch(`/graphs/graphs_${this.attributes.name.value}.svg`).then(async svg => this.setInnerSvg(await svg.text()))
			})
			this.intersectionObserver.observe(this);
		}

		// get font
		document.fonts.load('1em Permanent Marker').then(() => {
			this.classList.add('font-loaded')
		})
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
	}

	get $svg() {
		return this._svg
	}

	setInnerSvg(serializedHTML) {
		const fragment = document.createRange().createContextualFragment(serializedHTML)
		const node = fragment.firstElementChild
		if (this.$svg)
			this.replaceChild(node, this.$svg)
		else
			this.appendChild(node)
		this.$svg = node
	}
}