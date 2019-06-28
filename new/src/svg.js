let LETTERS
export default class SVGAnim {
    constructor(letters) {
        LETTERS = letters

        const pythagore = (A, B) => Math.sqrt(Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2))

        SVGElement.prototype.hasLength = function () {
            return ['line', 'polyline', 'path'].includes(this.tagName.toLowerCase())
        }

        SVGElement.prototype.isGroup = function () {
            return ['svg', 'g'].includes(this.tagName.toLowerCase())
        }

        SVGElement.prototype.isText = function () {
            return ['text', 'tspan'].includes(this.tagName.toLowerCase())
        }

        SVGLineElement.prototype.getTotalLength = function () {
            return pythagore([this.getAttribute('x1'), this.getAttribute('y1')], [this.getAttribute('x2'), this.getAttribute('y2')])
        }

        SVGPolylineElement.prototype.getTotalLength = function () {
            return this.getAttribute('points').trim().split(' ')
                .map(point => point.split(',').map(parseFloat))
                .reduce((acc, point, index, points) => { return index > 0 && acc + pythagore(points[index - 1], point) }, 0)
        }
    }

    static textToSVGAlphabet(svg) {
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

    // TODO: should return a promise bc this will take time
    static reset(svg) {
        const callback = (element) => {
            if (element.dataset.type !== 'erase')
                window.requestAnimationFrame(() => {
                    element.style.transition = 'none'
                    element.style.strokeDashoffset = '0'
                    element.style.visibility = 'visible'
                    element.style.opacity = '1'
                })
        }
        SVGAnim.walkSVGTree(svg, callback)
    }


    // TODO: should return a promise bc this will take time
    static freeze(svg) {
        const callback = (element) => {
            if (element.dataset.type !== 'erase')
                window.requestAnimationFrame(() => {
                    const computedStyle = window.getComputedStyle(element)
                    element.style.strokeDashoffset = computedStyle.getPropertyValue('stroke-dashoffset')
                    element.style.visibility = computedStyle.getPropertyValue('visibility')
                    element.style.opacity = computedStyle.getPropertyValue('opacity')
                    element.style.transition = 'none'
                })
        }
        SVGAnim.walkSVGTree(svg, callback)
    }

    // TODO: decompose function (we'll need drawElementSVG for restart_from_where_it_paused)
    static animate(svg) {
        const FULL = svg.tagName.toLowerCase() === 'svg' // sending full SVG animates everything, sending a single SVGElement animates only the element
        const SPEED = localStorage.getItem('speed') || 5 // easy 1 - 10 scale for UI
        let resolve, reject

        const drawElementSVG = (element) => {
            // use CSS animation to animate drawing of strokes
            const getElementSmoothing = (element) => {
                switch (element.dataset.type) {
                    case 'writing':  // || !element.getAttribute('stroke')
                        return 'ease-out'
                    case 'erase':
                        return 'linear'
                    default:
                        return 'ease-in-out'
                }
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

                const anim = (element, delay) => {
                    if (!element.hasLength() || (FULL && element.dataset.type === 'erase'))
                        return 0

                    // add delay when changing color (taking a new marker)
                    if (FULL && delay !== 0) {
                        const newColor = element.getAttribute('stroke') || '#000000'
                        if (color !== newColor)
                            delay += .25
                        color = newColor
                    }

                    // add delay between traits (lifting hand) except when writing
                    if (FULL && delay !== 0 && element.dataset.type !== 'writing')
                        delay += .1
                    const duration = getElementDuration(element)
                    requestAnimationFrame(() => {
                        // compensate for processing time (non negligible over many operations)
                        const overshot = (performance.now() - startAt) / 1000
                        element.style.transition = `stroke-dashoffset ${duration}s ${getElementSmoothing(element)} ${delay - overshot}s, opacity 0s ${delay - overshot}s`
                        element.style.strokeDashoffset = '0'
                        element.style.visibility = 'visible'
                        element.style.opacity = '1'

                        setTimeout(() => element.style.transition = 'none', (delay - overshot + duration) * 1000)
                    })
                    return duration
                }

                const parentCallback = (element) => {
                    delay += .5
                }
                const childCallback = (element) => {
                    delay += anim(element, delay)
                }
                SVGAnim.walkSVGTree(element, childCallback, parentCallback)

                return delay - ((performance.now() - startAt) / 1000)
            }
            const timeUntilAnimationEnd = animateSVGTree(element)
            setTimeout(resolve, timeUntilAnimationEnd * 1000)
        }

        const prepareDrawingSVG = (element) => {
            // set styles to zero, starting point of animation
            const initStyle = (element) => {
                if (!element.hasLength()) return
                const length = element.getTotalLength()
                element.style.transition = 'none'
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
            // TODO: prepareDrawingSVG should return a promise and the following requestAnimationFrame be inside its .then()
            prepareDrawingSVG(svg)
            requestAnimationFrame(() => drawElementSVG(svg))
        })
    }

    static walkSVGTree(element, childCallback, parentCallback) {
        const depth = (element) => {
            if (element.isText()) {
                return
            } else if (!element.isGroup()) {
                if (childCallback) childCallback(element)
            } else {
                if (parentCallback) parentCallback(element)
                for (let child of element.children) {
                    depth(child)
                }
            }

        }
        depth(element)
    }
}

