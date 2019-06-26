import SVGAnim from "./svg.js";

export default class SVGCard extends HTMLElement{
    constructor() {
        super()

        this.svg = this.querySelector('svg')
        this.state = {}
        this.info = {}
    }

    set worker(worker) {
        this.worker = worker

        // TODO: on worker setter, register informations to worker (change worker.js too)
        // // Send worker JSON of all graphs
        // requestIdleCallback(() => worker.postMessage(JSON.stringify({ graphs: articles.map(article => { 
        //     return {
        //         name: article.data.name,
        //         content: !!article.data.content
        //     }
        // }) })))
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
    }

    play() {
        return SVGAnim.animate(this.svg)
    }

    erase() {
        return SVGAnim.animate(this.erasePath)
    }

    unerase() {
        this.erasePath.style.display = 'none'
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
                this.replaceChild(svg, this.querySelector('svg'))
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
            if (this.rawXML) {
                resolve(this.rawXML)
                if (!localStorage.getItem(this.name))
                    localStorage.setItem(this.name, this.rawXML)
                return
            }
            const localContent = localStorage.getItem(this.name)
            if (localContent)
                return resolve(localContent)
            worker.customWorkerResponses.push(data => {
                const content = data[this.name]
                if (!content)
                    return false
                localStorage.setItem(this.name, content)
                return resolve(content)
            })
            worker.postMessage(JSON.stringify({ raw: this.key })) // TODO: request with this.name instead
        })
    
        return getRaw
    }
}