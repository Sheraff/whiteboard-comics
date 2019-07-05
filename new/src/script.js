import SVGAnim from "./svg.js";
import SVGCard from "./card.js";
import CardArray from "./layout.js"

/////////////////////
// SVG SETUP
/////////////////////


new SVGAnim(LETTERS)


/////////////////////
// WEB WORKER
/////////////////////

const worker = new Worker('src/worker.js')
worker.customWorkerResponses = []
worker.onmessage = e => {
	const message = JSON.parse(e.data)
	worker.customWorkerResponses.forEach((response, key) => {
		const res = response(message)
		if (res) worker.customWorkerResponses.splice(key, 1)
	})
}


/////////////////////
// CARDS & HYDRATION
/////////////////////

customElements.define('svg-card', SVGCard)
const cards = CardArray.querySelectorAll('svg-card')
cards.forEach((card, key) => {
	card.graph = GRAPHS[key]
	card.key = key
	card.worker = worker
})


cards.forEach(card => { // TODO: move to Layout or to Card ? 
	card.addEventListener('click', (e) => {
		e.stopPropagation()
		cards.cardPop(card)
	})
})
window.addEventListener('keyup', (e) => {
	switch (e.key) {
		case 'Escape':
			if (cards.activeIndex !== -1) cards.cardPop(cards[cards.activeIndex])
			break
		case 'ArrowLeft':
			cards.prev()
			break
		case 'ArrowRight':
			cards.next()
			break
	}
})


//// THUMBNAILS PATH




const loadOnIntersection = (entries, observer) => {
	entries.filter(entry => entry.isIntersecting)
		.forEach(entry => {
			observer.unobserve(entry.target)
			Promise.all([
				entry.target.getContent(),
				document.fonts.load('1em Permanent Marker')
			])
				.then(([xml]) => entry.target.processSVG(xml))
		})
}

const loadIntersectionObserver = new IntersectionObserver(loadOnIntersection, { rootMargin: `${window.innerHeight}px` })

cards.forEach(card => { loadIntersectionObserver.observe(card) })
document.addEventListener('active', e => {
	console.log(e)
})