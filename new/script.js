const articles = [...document.querySelectorAll('section article')]
let activeIndex = -1
const placeholder = document.createElement('article')

/////////////////////////
// IT'S TIME TO REFACTOR, I GET LOST IN MY OWN CODE => MAKE USE OF IMPORTS
/////////////////////

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
// use .active <article> class, make transitions (position, calculate, transform, release)
// prevent scrolling when an <article> is front

// TODO: document all attributes of <article> like .state, .active, .svg, .erase...

//// MAIN PATH


function transitionArticle(article, on = false, animate = false, duration = .5) {

    const getAction = (resolve) => () => {
        article.data.queued = true
        // memorize
        let orig 
        if(animate) orig = article.getBoundingClientRect()
        // apply
        article.classList[on ? 'add' : 'remove']('frontClassToUseForMainGraph')
        if(on){
            if(article.classList.contains('featured'))
                placeholder.classList.add('featured')
            article.classList.add('active')
            article.data.active = true
            article.parentNode.insertBefore(placeholder, article)
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
        const dest = article.getBoundingClientRect()
        // transform
        const wRatio = orig.width / dest.width
        const hRatio = orig.height / dest.height
        article.style.transition = `none`
        article.svg.style.transition = `none`
        article.style.transform = `translate(${orig.left - dest.left}px, ${orig.top - dest.top}px) scale(${wRatio}, ${hRatio})`
        article.svg.style.transform = `translate(-50%, -50%) scale(${Math.min(wRatio, hRatio) / wRatio}, ${Math.min(wRatio, hRatio) / hRatio})`
        // release
        window.requestAnimationFrame(() => {
            article.style.transition = `transform ${duration}s linear`
            article.svg.style.transition = `transform ${duration}s linear`
            article.style.transform = `translate(0, 0) scale(1, 1)`
            article.svg.style.transform = `translate(-50%, -50%) scale(1, 1)`
            setTimeout(() => after(resolve), duration*1000)
        })
    }

    const after = (resolve) => {
        if(!on) {
            article.classList.remove('active')
            article.data.active = false
        }
        resolve()
        const queued = article.data.queued
        delete article.data.queued
        if(typeof queued === 'function')
            queued()
    }

    return new Promise(resolve => {
        const action = getAction(resolve)
        if(article.data.queued)
            article.data.queued = action
        else
            action()
    })
    
}

function updateOverlay(article) {
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

    overlay.querySelector('.date').innerText = readableDate(article.data.release)
    overlay.querySelector('.credit').innerText = article.data.credit
    overlay.querySelector('.collab a').innerText = article.data.author
    overlay.classList.add('front')
}

// pop an article in / out of the list view
function articlePop(article, on) {
    // function as a toggle if no behavior is specified by 'on'
    if (on === undefined)
        on = article.data.state === undefined ? true : !article.data.state
    article.data.state = on

    // turn OFF case
    if (!on) {
        if(activeIndex!==-1 && articles[activeIndex] === article)
            activeIndex = -1
        return transitionArticle(article, on, true)
    }
    // turn ON case
    else {
        if (activeIndex!==-1 && articles[activeIndex] !== article) {
            articlePop(articles[activeIndex], false)
            articles[activeIndex].classList.remove('active')
            articles[activeIndex].data.active = false
        }
        activeIndex = article.data.key
        return Promise.all([
            transitionArticle(article, on, true),
            animateSVG(article.erase)
        ])
        .then(() => afterTransitionArticle(article))
    }
}

// switch from one expanded article to another one without going back to list view, mainly used for next / prev
function articleSwitch(article, on) {
    // function as a toggle if no behavior is specified by 'on'
    if (on === undefined)
        on = article.data.state === undefined ? true : !article.data.state
    article.data.state = on

    // turn OFF case
    if (!on)
        return animateSVG(article.erase)
            .then(() => transitionArticle(article, on))
            .then(() => article.erase.style.display = 'none')
    // turn ON case
    else {
        if (activeIndex===-1 || articles[activeIndex] === article)
            throw 'cannot just articleSwitch from nothing, nor articleSwitch to itself'
        const previous = articles[activeIndex]
        activeIndex = article.data.key
        return articleSwitch(previous, false)
            .then(() => transitionArticle(article, on))
            .then(() => afterTransitionArticle(article))
    }
}

const afterTransitionArticle = (article) => {
    const animate = () => new Promise(resolve => {
        if(article.data.texted) {
            animateSVG(article.svg)
            resolve()
        } else {
            textToSVGAlphabet(article.svg)
            .then(() => {
                article.classList.add('texted')
                article.data.texted = true
                animateSVG(article.svg)
                resolve()
            })
        }
    })
    
    animate()
    // .then(() => { console.log('toggle and fill #overlay') })
    .then(() => {
        console.log('coucou', article.data.key)
        if(article.data.key!==0){
            textToSVGAlphabet(articles[article.data.key-1].svg) // TODO: these won't process svg... WHY ?!
        }
        if(article.data.key!==articles.length-1){
            textToSVGAlphabet(articles[article.data.key+1].svg) // TODO: these won't process svg... WHY ?!
        }
    })
}

// TODO: make processFetchedSVG stack callbacks if called several times (it takes time (a little) so it can potentially be called several times while executing)
// TODO: finish makeArticleReady() so that it can be called at anytime and resolve when the graph is ready to be put through animateSVG()
// TODO: use makeArticleReady() for all interactions (switch & pop) as well as for preparing graphs (next & prev)
const makeArticleReady = (article) => {
    if(!article.data.processed)
        return Promise.all([
            getSVG(article),
            document.fonts.load('1em Permanent Marker')
        ])
        .then(([xml]) => {
            article.data.texted = false
            return processFetchedSVG(article, xml)
        })
    else if(!article.data.texted)
        return textToSVGAlphabet(article.svg)
    else
        return Promise.resolve()
}

articles.forEach(article => {
    article.addEventListener('click', (e) => {
        e.stopPropagation()
        if(article.data.state)
            articlePop(article)
        else
            articlePop(article)
    })
    article.addEventListener('mouseenter', (e) => {
        if(article.data.processed) {
            textToSVGAlphabet(article.svg)
            .then(() => { 
                article.classList.add('texted') 
                article.data.texted = true
            })
        } else
            article.data.texted = false
    }, {once: true})
})
window.addEventListener('keyup', (e) => {
    switch(e.key){
        case 'Escape':
            if (activeIndex!==-1) articlePop(articles[activeIndex])
            break;
        case 'ArrowLeft':
            if(activeIndex!==-1 && activeIndex!==0) articleSwitch(articles[activeIndex-1])
            break;
        case 'ArrowRight':
                if(activeIndex!==-1 && activeIndex!==articles.length-1) articleSwitch(articles[activeIndex+1])
                break;
    }
})


//// THUMBNAILS PATH


articles.forEach((article, key) => {
    article.data = GRAPHS[key]
    article.data.key = key
    article.data.state = false
    const localContent = localStorage.getItem(GRAPHS[key].name)
    if (localContent)
        article.data.content = localContent
    else {
        const svg = article.querySelector('svg')
        if (svg.childNodes.length) {
            article.data.content = svg.outerHTML
            localStorage.setItem(article.data.name, article.data.content)
        }
    }
})

const worker = new Worker('worker.js')
worker.customWorkerResponses = []
worker.onmessage = e => {
    const data = JSON.parse(e.data)
    worker.customWorkerResponses.forEach((response, key) => {
        const res = response(data)
        if (res)
            worker.customWorkerResponses.splice(key, 1)
    })
}
// Send worker JSON of all graphs
requestIdleCallback(() => worker.postMessage(JSON.stringify({ graphs: articles.map(article => { 
    return {
        name: article.data.name,
        content: !!article.data.content
    }
}) })))


const getSVG = (article) => {
    const getRaw = new Promise((resolve, reject) => {
        if (article.data.content) {
            resolve(article.data.content)
            if (!localStorage.getItem(article.data.name))
                localStorage.setItem(article.data.name, article.data.content)
            return
        }
        const localContent = localStorage.getItem(article.data.name)
        if (localContent)
            return resolve(localContent)
        worker.customWorkerResponses.push(data => {
            const content = data[article.data.name]
            if (!content)
                return false
            localStorage.setItem(article.data.name, content)
            return resolve(content)
        })
        worker.postMessage(JSON.stringify({ raw: article.data.key }))
    })

    return getRaw
}

const processFetchedSVG = (article, xml) => {
    let resolve, reject

    // SVG starts in template (doesn't trigger DOM)
    window.requestIdleCallback(() => {
        article.data.content = xml
        const template = document.createElement('template')
        template.innerHTML = xml
        const svg = template.content.querySelector('svg')

        // the first white path should be the "erase" path so put it on top and label it so we can use it later
        article.erase = svg.querySelector('path[stroke="#FFFFFF"]')
        svg.removeChild(article.erase)
        article.erase.setAttribute('data-type', 'erase')
        article.erase.style.display = 'none'
        svg.appendChild(article.erase)
        
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
            article.replaceChild(svg, article.querySelector('svg'))
            article.svg = svg
            article.classList.add('processed')
            article.data.processed = true
            if(article.data.texted!==false)
                resolve(article)

            // replace <text> font elements, with <g> SVG elements (only is already requested before)
            if(article.data.texted===false) {
                textToSVGAlphabet(article.svg)
                .then(() => { 
                    article.classList.add('texted') 
                    article.data.texted = true
                    resolve(article)
                })
            }
        })
    })

    return new Promise((res, rej) => {
        resolve = res
        reject = rej        
    })
}

const loadOnIntersection = (entries, observer) => {
    entries.filter(entry => entry.isIntersecting)
        .forEach(entry => {
            observer.unobserve(entry.target)
            Promise.all([
                getSVG(entry.target),
                document.fonts.load('1em Permanent Marker')
            ])
            .then(([xml]) => processFetchedSVG(entry.target, xml))
        })
}

const loadIntersectionObserver = new IntersectionObserver(loadOnIntersection, { rootMargin: `${window.innerHeight}px` })

articles.forEach(article => {
    loadIntersectionObserver.observe(article)
    // MAYBE: intersectionObserver to display none SVGs outside of viewport
})


const textToSVGAlphabet = (svg) => {
    console.log(svg)
    // this is the costly operation. SVG must be part of DOM for it to work
    const processLetterSVG = letter => {
        const template = document.createElement('template')
        template.innerHTML = letter.content
        const svg = template.content.querySelector('svg')
        const [x, y, width, height] = (svg.getAttribute('viewbox') || svg.getAttribute('viewBox')).split(' ')
        letter.viewbox = { width, height }
        letter.content = svg
        return letter
    }

    const getLetter = letter => {
        return new Promise((resolve, reject) => {
            letter = letter.toLowerCase()
                .replace(/‘/g, "'")
                .replace(/’/g, "'")
                .replace(/“/g, '"')
                .replace(/”/g, '"')
            if (!LETTERS[letter])
                reject('letter not found')
            if (LETTERS[letter].viewbox)
                resolve(LETTERS[letter])
            else {
                if (LETTERS[letter].getting)
                    LETTERS[letter].getting.push(resolve)
                else {
                    LETTERS[letter].getting = [resolve]
                    LETTERS[letter].char = letter
                    requestIdleCallback(() => {
                        LETTERS[letter] = processLetterSVG(LETTERS[letter])
                        LETTERS[letter].getting.forEach(callback => callback(LETTERS[letter]))
                    })
                }
            }
        })
    }

    const loopOverAllSpans = (element, callback) => {
        const texts = element.querySelectorAll('text')
        texts.forEach(text => {
            const spans = [...text.querySelectorAll('tspan')]
            if (!spans.length) {
                callback(text)
            } else {
                const isLong = 40 < text.getNumberOfChars() + spans.length - 1
                spans.forEach(span => callback(span, isLong))
            }
        })
    }

    return new Promise((resolve, reject) => {
        const promises = []
        loopOverAllSpans(svg, (span) => {
            span.textContent.split('')
                .filter(char => char !== ' ')
                .forEach(char => {
                    promises.push(getLetter(char))
                })
        })
        Promise.all(promises)
            .catch(e => reject(e))
            .then((letters) => {
                loopOverAllSpans(svg, (span, isLong) => {
                    const isTSpan = span.tagName.toUpperCase() === 'TSPAN'
                    const transform = isTSpan ? span.parentElement.getAttribute('transform') : span.getAttribute('transform')
                    const color = span.getAttribute('fill') || span.parentElement.getAttribute('fill') || undefined
                    const reference = isTSpan ? span.parentElement : span
                    const pushPaths = []
                    span.textContent.split('').forEach((char, index) => {
                        if (char === ' ')
                            return
                        const letter = letters.shift()

                        const position = span.getStartPositionOfChar(index)
                        const paths = letter.content.cloneNode(true).querySelectorAll('path,line,polyline')

                        paths.forEach(path => {
                            path.parentNode.removeChild(path)
                            path.setAttribute('transform', `${transform} translate(${position.x}, ${position.y - letter.viewbox.height + 10})`)
                            path.setAttribute('data-type', 'writing')
                            if (isLong) path.setAttribute('data-paragraph', true)
                            if (color) path.setAttribute('stroke', color)
                            pushPaths.push(path)
                        })
                    })
                    window.requestAnimationFrame(() => {
                        pushPaths.forEach(path => {
                            reference.parentNode.insertBefore(path, reference)
                        })
                        resolve()
                    })
                })
            })
    })
}

const animateSVG = (svg) => {
    const FULL = svg.tagName.toLowerCase() === 'svg' // sending full SVG animates everything, sending a single SVGElement animates only the element
    const SPEED = localStorage.getItem('speed') || 5 // easy 1 - 10 scale for UI
    let resolve, reject

    const pythagore = (A, B) => Math.sqrt(Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2))

    SVGElement.prototype.hasLength = function () {
        return ['line', 'polyline', 'path'].indexOf(this.tagName.toLowerCase()) !== -1
    }

    SVGElement.prototype.isGroup = function () {
        return ['svg', 'g'].indexOf(this.tagName.toLowerCase()) !== -1
    }

    SVGLineElement.prototype.getTotalLength = function () {
        return pythagore([this.getAttribute('x1'), this.getAttribute('y1')], [this.getAttribute('x2'), this.getAttribute('y2')])
    }

    SVGPolylineElement.prototype.getTotalLength = function () {
        return this.getAttribute('points').trim().split(' ')
            .map(point => point.split(',').map(parseFloat))
            .reduce((acc, point, index, points) => { return index > 0 && acc + pythagore(points[index - 1], point) }, 0)
    }

    const drawElementSVG = (element) => {
        // use CSS animation to animate drawing of strokes
        const getElementSmoothing = (element) => {
            if (element.dataset.type === 'writing' || !element.getAttribute('stroke'))
                return 'ease-out'
            if (element.dataset.type === 'erase')
                return 'linear'
            return 'ease-in-out'
        }

        // speed logic
        const getElementDuration = (element) => {
            if (!element.hasLength()) return
            let power = .6
            if (element.dataset.type === 'writing' || !element.getAttribute('stroke'))
                power = element.dataset.paragraph ? .1 : .25
            if (element.dataset.type === 'erase')
                power = .4

            return .1 / SPEED * Math.pow(element.getTotalLength(), power)
        }

        // timing logic
        const animateSVGTree = (element) => {
            let delay = 0
            let color
            const startAt = performance.now()
            const depth = (element) => {
                if (!element.isGroup())
                    return delay += anim(element, delay)

                // add delay when changing group (allows for timing from Illustrator)
                delay += .5
                const children = [...element.children]
                children.forEach(child => depth(child))
            }
            const anim = (element, delay) => {
                if (!element.hasLength() || (FULL && element.dataset.type === 'erase'))
                    return 0

                // add delay when changing color (taking a new marker)
                if(!FULL && delay!==0){
                    const newColor = element.getAttribute('stroke') || '#000000'
                    if (color !== newColor)
                        delay += .25
                    color = newColor
                }

                // add delay between traits (lifting hand) except when writing
                if (!FULL && delay!==0 && element.dataset.type !== 'writing')
                    delay += .1
                const duration = getElementDuration(element)
                requestAnimationFrame(() => {
                    // compensate for processing time (non negligible over many operations)
                    element.classList.add('yesanim')
                    const overshot = (performance.now() - startAt) / 1000
                    element.style.transition = `stroke-dashoffset ${duration}s ${getElementSmoothing(element)} ${delay - overshot}s, opacity 0s ${delay - overshot}s`
                    element.style.strokeDashoffset = '0'
                    element.style.visibility = 'visible'
		            element.style.opacity = '1'
                    
                    setTimeout(() => element.classList.remove('yesanim'), (delay - overshot + duration) * 1000)
                })
                return duration
            }
            depth(element)
            return delay - ((performance.now() - startAt) / 1000)
        }
        const timeUntilAnimationEnd = animateSVGTree(element)
        setTimeout(() => console.log('animation ended', FULL), timeUntilAnimationEnd*1000)
        console.log(timeUntilAnimationEnd)
        setTimeout(resolve, timeUntilAnimationEnd*1000)
    }

    const prepareDrawingSVG = (element) => {
        // set styles to zero, starting point of animation
        const initStyle = (element) => {
            if (!element.hasLength()) return
            const length = element.getTotalLength()
            element.classList.remove('yesanim')
            requestAnimationFrame(() => {
                element.style.strokeDasharray = length + ' ' + length
                element.style.strokeDashoffset = length
                element.style.visibility = 'hidden'
		        element.style.opacity = '0'
            })
        }

        initStyle(element)
        if (FULL) for (let child of element.children) {
            if (child.nodeType === 3) continue
            if (child.dataset.type === 'erase') continue
            prepareDrawingSVG(child)
        }
    }

    return new Promise((res, rej) => {
        resolve = res
        reject = rej

        if (FULL) svg.querySelector('[data-type="erase"]').style.display = 'none'
        else svg.style.display = 'inherit'
        prepareDrawingSVG(svg)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => drawElementSVG(svg))
        })
    })
}