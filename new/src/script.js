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

// KEEP IN MIND: both path should start up in parallel 
// - path 1: interactivity, pop, event listener, 1st graph opened
// - path 2: archives, loading SVGs, processing, intersectionObserver, worker

// IDEA: "contact" is a drawable canvas
// IDEA: while loading a card, draw scribble (stick figures, sun, house, heart, smiley, hashtag, dicks, math equations, mini graphs) on it and erase them when loaded (flip board when done ?)
// IDEA: archive's tag list is scrollable so that the sidebar never exceeds 100vh ? (i still like better the old option: sibebar is sticky if taller than content)
// IDEA: on hover, prev and next buttons show keyboard arrow keys (images) to indicate that you can use your keyboard (and archive shows escape key)
// IDEA: on list view, arrow keys allow to select a card (w/ style change) and ENTER key pops card. a previously poped card remains the active one until arrow keys navigate

// use onload="preloadFinished()" on <link> to start worker tasks ?
// TODO: separate immediately-needed JS and later-is-fine JS into 2 separate script files
// TODO: find out how to switch to HTTP2
// TODO: optimization: remove querySelector as much as possible (and cache DOM into variables instead) (especially in the costly alphabet section) (other methods of getting DOM elements are barely faster, no need to optimize for this except in extreme cases)
// TODO: use simple CSS selectors (id is best, classes are preferred, then tags, and then compositing many items)

// TODO: boredom loading of graphs => clearTimeout on IntersectionObserver, load graph on requestIdleCallback, make sure the entire SVG processing has a way to be done async in succession of requestIdleCallbacks (have a 'priority' flag argument for when the processing is for the viewport?)
// TODO: batch DOM changes
// TODO: store server-side processed svg to reduce time-to-first-byte
// TODO: add service worker (exclusively for .svg requests): can cache raw .svg (instead of localstorage) and in localstorage well put stringified versions of PROCESSED svgs (w/ alphabet replaced)

// TODO: prevent scrolling when an <card> is front

// TODO: document all attributes of <card> like .state, .active, .svg, .erase...
// TODO: preload all modules with <link> attributes

// TODO: make processArticleSVG stack callbacks if called several times (it takes time (a little) so it can potentially be called several times while executing)




cards.forEach(card => {
    card.addEventListener('click', (e) => {
        e.stopPropagation()
        if(card.state.open)
            cards.cardPop(card)
        else
            cards.cardPop(card)
    })
    card.addEventListener('mouseenter', (e) => {
        if(card.state.processed) {
            card.alphabet()
            .then(() => { 
                card.classList.add('texted') 
                card.state.texted = true
            })
        } else
            card.state.texted = false
    }, {once: true})
})
window.addEventListener('keyup', (e) => {
    switch(e.key){
        case 'Escape':
            if (cards.activeIndex!==-1) cards.cardPop(cards[cards.activeIndex])
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


