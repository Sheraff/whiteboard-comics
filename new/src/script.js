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


////////////////////
// NAVIGATION & URL
////////////////////

cards.forEach(card => { // TODO: move to Layout or to Card ? 
	// cards have an anchor overlay for SEO & "open in new tab" but don't use them in regular navigation
	card.anchor.addEventListener('click', e => {
		if(e.altKey || e.ctrlKey || e.shiftKey || e.metaKey)
			return
		e.preventDefault()
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

const pushState = ({ name = 'archives', key = -1 }) => {
	if (history.state && history.state.key === key)
		return
	history.pushState({ name, key }, name, name)
}

window.addEventListener('popstate', ({ state: { name, key } }) => {
	if (name === 'archives')
		pushState({ name, key })
	else switch (cards.activeIndex) {
		case key:
			return;
		case -1:
			cards.cardPop(cards[key], true)
			break;
		default:
			cards.cardSwitch(cards[key], true)
			break;
	}
})

document.addEventListener('open', ({ detail: { card } }) => pushState(card))

const landedActiveCard = document.querySelector('svg-card.front')
if (landedActiveCard) {
	cards.activeIndex = landedActiveCard.key
	console.dir(landedActiveCard)
	landedActiveCard.immediate()
	pushState(landedActiveCard)
} else {
	pushState({})
}
// TODO: if landedActiveCard, loadIntersectionObserver acts on requestIdleCallback to prevent heavy page initialization


// ['hydrated', 'open', 'processed', 'texted', 'active', 'front'].forEach(prop => {
// 	document.addEventListener(prop, ({detail}) => console.log(`${prop} card ${detail.card.key}`, detail))
// })


////////////////
// LAZY LOADING
////////////////

const loadOnIntersection = (entries, observer) => {
	entries.filter(entry => entry.isIntersecting)
		.forEach(entry => {
			observer.unobserve(entry.target)
			if (!entry.target.state.processing) {
				Promise.all([
					entry.target.getContent(),
					document.fonts.load('1em Permanent Marker')
				])
					.then(([xml]) => entry.target.processSVG(xml))
			}
		})
}
const loadIntersectionObserver = new IntersectionObserver(loadOnIntersection, { rootMargin: `${window.innerHeight}px` })
cards.forEach(card => { loadIntersectionObserver.observe(card) })
