import SVGAnim from "./svg.js";
import SVGCard from "./card.js";
// LETTERS are given from index.php

new SVGAnim(LETTERS)
customElements.define('svg-card', SVGCard)
const cards = document.querySelectorAll('svg-card')


cards.forEach((card, key) => {
    card.graph = GRAPHS[key]
    card.key = key
    card.state.state = false
})



let activeIndex = -1
const placeholder = document.createElement('card')

// TODO: both path should start up in parallel 
// - path 1: interactivity, pop, event listener, 1st graph opened
// - path 2: archives, loading SVGs, processing, intersectionObserver, worker

// IDEA: "contact" is a drawable canvas
// IDEA: while loading a card, draw scribble (stick figures, sun, house, heart, smiley, hashtag, dicks, math equations, mini graphs) on it and erase them when loaded (flip board when done ?)
    // IDEA: some other cards are 2x2 (if big, regular otherwise) to put my favorites forward? (or random ?)
// IDEA: on archives, arrows allow you to select a card, enter/space to open
// IDEA: archive's tag list is scrollable so that the sidebar never exceeds 100vh ? (i still like better the old option: sibebar is sticky if taller than content)
// IDEA: on hover, prev and next buttons show keyboard arrow keys (images) to indicate that you can use your keyboard (and archive shows escape key)

// use onload="preloadFinished()" on <link> to start worker tasks ?
// TODO: separate immediately-needed JS and later-is-fine JS into 2 separate script files
// TODO: find out how to switch to HTTP2
// TODO: optimization: remove querySelector as much as possible (and cache DOM into variables instead) (especially in the costly alphabet section) (other methods of getting DOM elements are barely faster, no need to optimize for this except in extreme cases)
// TODO: use simple CSS selectors (id is best, classes are preferred, then tags, and then compositing many items)

// TODO: boredom loading of graphs => clearTimeout on IntersectionObserver, load graph on requestIdleCallback, make sure the entire SVG processing has a way to be done async in succession of requestIdleCallbacks (have a 'priority' flag argument for when the processing is for the viewport?)
// TODO: batch DOM changes
// TODO: store server-side processed svg to reduce time-to-first-byte
// TODO: add service worker (exclusively for .svg requests): can cache raw .svg (instead of localstorage) and in localstorage well put stringified versions of PROCESSED svgs (w/ alphabet replaced)

// MAIN TODO: NAVIGATION w/ DEPLOYED GRAPH
// use .active <card> class, make transitions (position, calculate, transform, release)
// prevent scrolling when an <card> is front

// TODO: document all attributes of <card> like .state, .active, .svg, .erase...


const worker = new Worker('src/worker.js')
worker.customWorkerResponses = []
worker.onmessage = e => {
    const data = JSON.parse(e.data)
    worker.customWorkerResponses.forEach((response, key) => {
        const res = response(data)
        if (res) worker.customWorkerResponses.splice(key, 1)
    })
}


function transitionArticle(card, on = false, animate = false, duration = .5) {

    const getAction = (resolve) => () => {
        card.state.queued = true
        // memorize
        let orig 
        if(animate) orig = card.getBoundingClientRect()
        // apply
        card.classList[on ? 'add' : 'remove']('frontClassToUseForMainGraph')
        if(on){
            if(card.classList.contains('featured'))
                placeholder.classList.add('featured')
            card.classList.add('active')
            card.state.active = true
            card.parentNode.insertBefore(placeholder, card)
        } else {
            placeholder.classList.remove('featured')
            placeholder.remove()
        }
        if(animate)
            animation(orig, resolve)
        else 
            after(resolve)

    }

    const animation = (orig, resolve) => {
        const dest = card.getBoundingClientRect()
        // transform
        const wRatio = orig.width / dest.width
        const hRatio = orig.height / dest.height
        card.style.transition = `none`
        card.svg.style.transition = `none`
        card.style.transform = `translate(${orig.left - dest.left}px, ${orig.top - dest.top}px) scale(${wRatio}, ${hRatio})`
        card.svg.style.transform = `translate(-50%, -50%) scale(${Math.min(wRatio, hRatio) / wRatio}, ${Math.min(wRatio, hRatio) / hRatio})`
        // release
        window.requestAnimationFrame(() => {
            card.style.transition = `transform ${duration}s linear`
            card.svg.style.transition = `transform ${duration}s linear`
            card.style.transform = `translate(0, 0) scale(1, 1)`
            card.svg.style.transform = `translate(-50%, -50%) scale(1, 1)`
            setTimeout(() => after(resolve), duration*1000)
        })
    }

    const after = (resolve) => {
        if(!on) {
            card.classList.remove('active')
            card.state.active = false
        }
        resolve()
        const queued = card.state.queued
        delete card.state.queued
        if(typeof queued === 'function')
            queued()
    }

    return new Promise(resolve => {
        const action = getAction(resolve)
        if(card.state.queued)
            card.state.queued = action
        else
            action()
    })
    
}

function updateOverlay(card) {
    const readableDate = (release) => {
        Date.prototype.getLitteralMonth = function () {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            return monthNames[this.getMonth()]
        }

        Date.prototype.getDatePostfix = function () {
            const date = this.getDate()
            if (date > 3 && date < 21)
                return 'th'
            switch (date % 10) {
                case 1:
                    return 'st'
                case 2:
                    return 'nd'
                case 3:
                    return 'rd'
                default:
                    return 'th'
            }
        }
        const date = new Date(`${release[1]} / ${release[2]} / ${release[0]}`)
        return `published on ${date.getLitteralMonth()} ${parseInt(release[2])}${date.getDatePostfix()}, ${release[0]}`
    }

    overlay.querySelector('.date').innerText = readableDate(card.info.release)
    overlay.querySelector('.credit').innerText = card.info.credit
    overlay.querySelector('.collab a').innerText = card.info.author
    overlay.classList.add('front')
}

// pop an card in / out of the list view
function cardPop(card, on) {
    // function as a toggle if no behavior is specified by 'on'
    if (on === undefined)
        on = card.state.state === undefined ? true : !card.state.state
    card.state.state = on

    // turn OFF case
    if (!on) {
        if(activeIndex!==-1 && cards[activeIndex] === card)
            activeIndex = -1
        return transitionArticle(card, on, true)
    }
    // turn ON case
    else {
        if (activeIndex!==-1 && cards[activeIndex] !== card) {
            cardPop(cards[activeIndex], false)
            cards[activeIndex].classList.remove('active')
            cards[activeIndex].data.active = false
        }
        activeIndex = card.key
        return Promise.all([
            transitionArticle(card, on, true),
            card.erase()
        ])
        .then(() => afterTransitionArticle(card))
    }
}

// switch from one expanded card to another one without going back to list view, mainly used for next / prev
function cardSwitch(card, on) {
    // function as a toggle if no behavior is specified by 'on'
    if (on === undefined)
        on = card.state.state === undefined ? true : !card.state.state
    card.state.state = on

    // turn OFF case
    if (!on)
        return card.erase()
            .then(() => transitionArticle(card, on))
            .then(() => card.unerase())
    // turn ON case
    else {
        if (activeIndex===-1 || cards[activeIndex] === card)
            throw 'cannot just cardSwitch from nothing, nor cardSwitch to itself'
        const previous = cards[activeIndex]
        activeIndex = card.key
        return cardSwitch(previous, false)
            .then(() => transitionArticle(card, on))
            .then(() => afterTransitionArticle(card))
    }
}

const afterTransitionArticle = (card) => {
    const animate = () => new Promise(resolve => {
        if(card.state.texted) {
            card.play()
            resolve()
        } else {
            card.alphabet()
            .then(() => {
                card.classList.add('texted')
                card.state.texted = true
                card.play()
                resolve()
            })
        }
    })
    
    animate()
    // .then(() => { console.log('toggle and fill #overlay') })
    .then(() => {
        if(card.key!==0){
            cards[card.key-1].alphabet()
        }
        if(card.key!==cards.length-1){
            cards[card.key+1].alphabet()
        }
    })
}

// TODO: make processArticleSVG stack callbacks if called several times (it takes time (a little) so it can potentially be called several times while executing)
// TODO: finish makeArticleReady() so that it can be called at anytime and resolve when the graph is ready to be put through SVGAnim.animate()
// TODO: use makeArticleReady() for all interactions (switch & pop) as well as for preparing graphs (next & prev)
const makeArticleReady = (card) => {
    if(!card.state.processed)
        return Promise.all([
            card.getContent(),
            document.fonts.load('1em Permanent Marker')
        ])
        .then(([xml]) => {
            card.state.texted = false
            return card.processSVG(xml)
        })
    else if(!card.state.texted)
        return card.alphabet()
    else
        return Promise.resolve()
}

cards.forEach(card => {
    card.addEventListener('click', (e) => {
        e.stopPropagation()
        if(card.state.state)
            cardPop(card)
        else
            cardPop(card)
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
            if (activeIndex!==-1) cardPop(cards[activeIndex])
            break;
        case 'ArrowLeft':
            if(activeIndex!==-1 && activeIndex!==0) cardSwitch(cards[activeIndex-1])
            break;
        case 'ArrowRight':
                if(activeIndex!==-1 && activeIndex!==cards.length-1) cardSwitch(cards[activeIndex+1])
                break;
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


