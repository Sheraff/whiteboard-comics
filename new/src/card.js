import SVGAnim from "./svg.js";

export default class SVGCard extends HTMLElement{
    constructor() {
        super()

        this.svg = this.querySelector('svg')
        this.state = {
            open:     false, // whether the card is in the grid, or poped-out to the front
            hydrated: false, // whether the card was hydrated with info from the database (php dump only for now)
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
                    content: !!this.rawXML,
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

        const localContent = localStorage.getItem(graph.name)
        if (localContent)
            this.rawXML = localContent
        else {
            if (this.svg.childNodes.length) {
                this.rawXML = this.svg.outerHTML
                localStorage.setItem(graph.name, this.rawXML)
            }
        }

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
        return SVGAnim.textToSVGAlphabet(this.svg)
    }

    processSVG (xml) {
        let resolve, reject
    
        // SVG starts in template (doesn't trigger DOM)
        window.requestIdleCallback(() => {
            this.rawXML = xml
            const template = document.createElement('template')
            template.innerHTML = xml
            const svg = template.content.querySelector('svg')
    
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
                this.replaceChild(svg, this.querySelector('svg')) // here is the only place this._svg should be set (and use appendChild), for everywhere else, this.svg is fine and should point to a getter
                this.svg = svg
                this.classList.add('processed')
                this.state.processed = true
                if(this.state.texted!==false)
                    resolve(this)
    
                // replace <text> font elements, with <g> SVG elements (only is already requested before)
                if(this.state.texted===false) {
                    SVGAnim.textToSVGAlphabet(this.svg)
                    .then(() => { 
                        this.classList.add('texted') 
                        this.state.texted = true
                        resolve(this)
                    })
                }
            })
        })
    
        return new Promise((res, rej) => {
            resolve = res
            reject = rej        
        })
    }

    getContent () {
        const getRaw = new Promise((resolve, reject) => {
            // already in here (store is necessary)
            if (this.rawXML) {
                resolve(this.rawXML)
                if (!localStorage.getItem(this.name))
                    localStorage.setItem(this.name, this.rawXML)
                return
            }

            // in storage, extract
            const localContent = localStorage.getItem(this.name)
            if (localContent)
                return resolve(localContent)

            // request from worker (and store)
            this._worker.customWorkerResponses.push(message => {
                // check if this response is for this card
                if (message.name!==this.name)
                    return false
                localStorage.setItem(this.name, message.content)
                resolve(message.content)
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
                card.state.texted = false
                return card.processSVG(xml)
            })
        else if(!card.state.texted)
            return card.alphabet()
        else
            return Promise.resolve()
    }
}