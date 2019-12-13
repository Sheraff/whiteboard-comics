import Alphabet from '/modules/Alphabet.js'
import IdleStack from '/modules/IdleStack.js'

export default function textToSVGAlphabet(svg) {

	const alphabet = new Alphabet()
	const stack = new IdleStack()

	function charDisambiguation(char) {
		return char.toLowerCase()
			.replace(/‘/g, "'")
			.replace(/’/g, "'")
			.replace(/“/g, '"')
			.replace(/”/g, '"')
	}

	async function getChar(rawChar, stack) {
		const char = charDisambiguation(rawChar)
		return () => {
			if (!stack.isFinishing)
				stack.onFinish(() => alphabet.finish())
			return await alphabet.finish().then(() => alphabet.getChar(char))
		}
	}

	const loopOverAllSpans = (element, callback) => {
		const texts = element.querySelectorAll('text')
		texts.forEach(text => {
			const spans = text.querySelectorAll('tspan')
			if (!spans.length) {
				callback(text)
			} else {
				const isLong = 40 < text.getNumberOfChars() + spans.length - 1 // TODO: getNumberOfChars is a costly function, replace w/ text.textContent.length ?
				spans.forEach(span => callback(span, isLong))
			}
		})
	}

	return new Promise((resolve, reject) => {
		const letterPromises = []
		loopOverAllSpans(svg, (span) => {
			span.textContent.split('')
				.filter(char => char !== ' ')
				.forEach(char => {
					letterPromises.push(getChar(char))
				})
		})
		Promise.all(letterPromises)
			.catch(e => reject(e))
			.then(letters => {
				const spanPromises = []
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
						const paths = letter.content.cloneNode(true).querySelectorAll('path,line,polyline') // TODO: cloneNode is costly, is there anything more efficient than cloneNode ? 

						paths.forEach(path => {
							path.parentNode.removeChild(path)
							path.setAttribute('transform', `${transform} translate(${position.x}, ${position.y - letter.viewbox.height + 10})`)
							path.setAttribute('data-type', 'writing')
							if (isLong) path.setAttribute('data-paragraph', true)
							if (color) path.setAttribute('stroke', color)
							pushPaths.push(path)
						})
					})
					spanPromises.push(new Promise(resolve => {
						requestAnimationFrame(() => {
							pushPaths.forEach(path => {
								reference.parentNode.insertBefore(path, reference)
							})
							resolve()
						})
					}))
				})
				Promise.all(spanPromises).then(resolve)
			})
	})
}