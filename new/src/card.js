import SVGAnim from "./svg.js";

class ElementState {
    constructor(element) {
        this.element = element

        // processed  : whether the svg has been processed (content is created based on XML, erase path is put in front, size is calculated based on viewbox)
        // texted     : whether the svg's <text> has been replaced w/ animatable <path> letters
        // active     : whether the card is the current one (z-index higher, current keyboard selection, is open, was just open, or will be opened)
        // open       : whether the card is in the grid, or poped-out to the front
        // hydrated   : whether the card was hydrated with info from the database (php dump only for now)
        // front      : TODO ???

        const states = ['hydrated', 'processed', 'texted', 'open', 'active', 'front']
        states.forEach(prop => {
            this[`_${prop}`] = false
            Object.defineProperty(this, prop, { 
                set: function(bool) { 
                    this[`_${prop}`] = bool
                    this.element.classList[bool ? 'add' : 'remove'](prop)
                    if(bool) document.dispatchEvent(new CustomEvent(prop, {detail: {card: this.element}}))
                },
                get: function() {
                    return this[`_${prop}`]
                }
            })
        })
    }
}

export default class SVGCard extends HTMLElement{
    constructor() {
        super()

        // shadow DOM
        this.attachShadow({mode: 'open'})
        const style = document.createElement('link')
        style.href = './svg.css'
        style.type = "text/css"
        style.rel = "stylesheet"
        this.shadowRoot.appendChild(style)
        this.shadowRoot.appendChild(document.createElement('slot'))

        // meta
        this.state = new ElementState(this)
        this.info = {} // metadata about graph content (release date, author, tags...)
        this.registerToWorker()

        // UX
        this.addEventListener('mouseenter', () => {
            if (this.state.processed) this.alphabet()
            else this.shouldProcessAlphabet = true
        }, { once: true })
    }

    registerToWorker() {
        Promise.all([
            new Promise(resolve => this.workerPromise = resolve),
            new Promise(resolve => this.hydratePromise = resolve)
        ]).then(() => {
            // hydrate worker
            requestIdleCallback(() => this._worker.postMessage(JSON.stringify({
                type: 'hydrate',
                data: {
                    name: this.name,
                    XML: !!this.rawXML
                }
            })))
        })
    }

    set worker(worker) {
        this._worker = worker
        this.workerPromise()
        delete this.workerPromise
    }

    set graph(graph) {
        this.info.release = graph.release
        this.info.credit = graph.credit
        this.info.author = graph.author
        this.name = graph.name

        const shadowSVG = this.shadowRoot.childNodes[1].assignedElements()
        if (shadowSVG.length)
            this.rawXML = shadowSVG[0].outerHTML

        this.state.hydrated = true
        this.hydratePromise()
        delete this.hydratePromise
    }

    play() {
        return SVGAnim.animate(this.svg)
    }

    resume() {
        // TODO (probably to integrate to play() and an associated this.state.playing flag)
        // will allow for changing speed of animation during animation
    }

    erase() {
        SVGAnim.freeze(this.svg) // TODO freeze() isn't working
        return SVGAnim.animate(this.erasePath)
    }

    unerase() {
        this.erasePath.style.display = 'none'
        return SVGAnim.reset(this.svg)
    }

    alphabet() {
        const promise = this.state.texted ? Promise.resolve() : SVGAnim.textToSVGAlphabet(this.svg)
        return promise.then(() => {
            delete this.shouldProcessAlphabet
            this.state.texted = true
        })
    }

    processSVG (xml) {
        let resolve, reject
    
        // SVG starts in template (doesn't trigger DOM)
        window.requestIdleCallback(() => {
            this.rawXML = xml
            const template = document.createRange().createContextualFragment(xml) // TODO: add a fallback to new DOMParser().parseFromString ??
            const svg = template.firstElementChild
    
            // the first white path should be the "erase" path so put it on top and label it so we can use it later
            this.erasePath = svg.querySelector('path[stroke="#FFFFFF"]')
            svg.removeChild(this.erasePath)
            this.erasePath.setAttribute('data-type', 'erase')
            this.erasePath.style.display = 'none'
            svg.appendChild(this.erasePath)
            
            // get all graphs to "look the same size" (meaning a small graph isn't displayed big to occupy all the available space)
            const SIZE_FACTOR = 1.4 // this formula assumes a max SVG size of 1000x1000px in Illustrator
            const viewbox = svg.getAttribute('viewBox').split(' ')
            const svgbox = svg.getBoundingClientRect()
            if (svgbox.width < svgbox.height)
                svg.style.width = (.9 * SIZE_FACTOR * viewbox[2] / 10) + '%'
            else
                svg.style.height = (.9 * SIZE_FACTOR * viewbox[3] / 10) + '%'
    
            // SVG is in DOM
            window.requestAnimationFrame(() => {
                // put SVG into place
                const shadowSVG = this.shadowRoot.childNodes[1].assignedElements()
                if(shadowSVG.length)
                    this.replaceChild(svg, shadowSVG[0])
                else
                    this.appendChild(svg)
                this.svg = svg
                this.state.processed = true
                if(!this.shouldProcessAlphabet)
                    resolve(this)
                // replace <text> font elements, with <g> SVG elements (only if already requested before)
                else
                    this.alphabet()
            })
        })
    
        return new Promise((res, rej) => {
            resolve = res
            reject = rej        
        })
    }

    getContent () {
        const getRaw = new Promise((resolve, reject) => {
            // already in here
            if (this.rawXML) {
                resolve(this.rawXML)
                return
            }

            // request from worker
            this._worker.customWorkerResponses.push(message => {
                // check if this response is for this card
                if (message.name!==this.name)
                    return false
                resolve(message.XML)
                return true
            })
            this._worker.postMessage(JSON.stringify({ 
                type: 'request',
                data: {
                    name: this.name
                }
            }))
        })
    
        return getRaw
    }
}