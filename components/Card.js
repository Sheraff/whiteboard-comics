import { requestIdleNetwork, cancelIdleNetwork } from '/modules/requestIdleNetwork.js'

export default class SVGCard extends HTMLElement {
	constructor() {
		super()
		this.svg = this.getInnerSvg()

		if (!this.svg) {
			// request whenever there is down time in the network
			this.svgRequestId = requestIdleNetwork(`/graphs/graphs_${this.attributes.name.value}.svg`, async svg => {
				if(this.intersectionObserver) {
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
				if (!this.svg && isCanceled)
					fetch(`/graphs/graphs_${this.attributes.name.value}.svg`).then(async svg => this.setInnerSvg(await svg.text()))
			})
			this.intersectionObserver.observe(this);
		}
	}

	getInnerSvg() {
		this.svg = this.querySelector('svg')
	}

	setInnerSvg(svg) {
		this.innerHTML = svg
		this.getInnerSvg()
	}
}