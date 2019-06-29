import SVGAnim from "./svg.js";

export default class SVGCard extends HTMLElement{
    constructor() {
        super()

        this.svg = this.querySelector('svg')
        this.state = {
            // queued, // temporary state (TODO: shouldn't be a state, might not even be necessary (is a flag for choosing between two paths but is always true))
            processed: false, // whether the svg has been processed (content is created based on XML, erase path is put in front, size is calculated based on viewbox)
            texted:    false, // whether the svg's <text> has been replaced w/ animatable <path> letters
            active:    false, // whether the card is the current one (z-index higher, current keyboard selection, is open, was just open, or will be opened)
            open:      false, // whether the card is in the grid, or poped-out to the front
            hydrated:  false, // whether the card was hydrated with info from the database (php dump only for now)
        }
        this.info = {} // metadata about graph content (release date, author, tags...)
        this.registerToWorker()
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
                    XML: !!this.rawXML,
                    key: this.key
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

        if (this.svg && this.svg.childNodes.length)
            this.rawXML = this.svg.outerHTML

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
            this.classList.add('texted')
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
                if(this.svg)
                    this.replaceChild(svg, this.querySelector('svg')) // here is the only place this._svg should be set (and use appendChild), for everywhere else, this.svg is fine and should point to a getter
                else
                    this.appendChild(svg)
                this.svg = svg
                this.classList.add('processed')
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

    // TODO: finish this function as 'get this card from any state to ready to play' and replace all other methods
    makeReady = (card) => {
        if(!card.state.processed)
            return Promise.all([
                card.getContent(),
                document.fonts.load('1em Permanent Marker')
            ])
            .then(([xml]) => {
                card.shouldProcessAlphabet = true
                return card.processSVG(xml)
            })
        else if(!card.state.texted)
            return card.alphabet()
        else
            return Promise.resolve()
    }
}