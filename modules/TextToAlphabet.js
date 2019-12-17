import Alphabet from '/modules/Alphabet.js'
import IdleStack from '/modules/IdleStack.js'

export default class TextToAlphabet {

	constructor(svg) {

		this.Alphabet = new Alphabet()

		this.stack = new IdleStack(async () => {
			if(svg.ownerDocument !== document || !svg.isConnected) {
				this.temp = document.createElement('div')
				this.temp.classList.add('svg-card')
				this.temp.appendChild(svg)
				document.getElementById("dom-tricks").appendChild(this.temp)
			}
		})
			.then(() => this.uniqueCharFromNode(svg))
			.then((chars) => {
				this.charsMap = {}
				const subtasks = chars.map(char => this.getChar(char, this.stack))
				this.stack.next(subtasks)
					.next(pairs => pairs.forEach(([char, node]) => this.charsMap[char] = node))
			})
			.then(() => Array.from(svg.querySelectorAll('text')))
			.then((texts) => {
				const subtasks = texts.map(text => () => this.getTextNodeData(text))
				this.stack.next(subtasks)
					.next(spansData => spansData.flat())
			})
			.then((spansData) => {
				const subtasks = spansData.map(data => () => this.getSpansCharData(data)).flat()
				this.stack.next(async () => await document.fonts.load('1em Permanent Marker'))
				this.stack.next(subtasks)
				this.stack.next(subtasks => { this.stack.next(subtasks.flat()) })
			})
			.then((spansCharData) => {
				const subtasks = spansCharData.flat().map(charNodeData => () => this.getCharNodesArray(charNodeData))
				this.stack.next(subtasks)
					.next(charsNodesChilren => charsNodesChilren.flat())
			})
			.then((charsNodesChilren) => {
				const referencesMap = new Map()
				const subtasks = charsNodesChilren.map(({ child, reference }) => () => {
					if (!referencesMap.has(reference))
						referencesMap.set(reference, new DocumentFragment())
					referencesMap.get(reference).appendChild(child)
				})
				this.stack.next(subtasks)
					.next(() => referencesMap)
			})
			.then((referencesMap) => {
				const subtasks = Array.from(referencesMap.entries())
					.map(([reference, fragment]) => this.placeFragmentBeforeRef(reference, fragment, this.stack))
				this.stack.next(subtasks)
			}).then(() => {
				if(this.temp)
					document.getElementById("dom-tricks").removeChild(this.temp)
			})
	}

	finish() {
		if(!this.readyPromise)
			this.readyPromise = new Promise(resolve => {
				this.stack.finish().then(() => resolve(this))
			})
		return this.readyPromise
	}

	get promise() {
		return this.stack.promise.then(() => this)
	}

	placeFragmentBeforeRef(reference, fragment, stack) {
		const insertFunction = () => reference.parentNode.insertBefore(fragment, reference)
		return async (_, onFinish) => {
			if (stack.isFinishing)
				return insertFunction()

			let requestId
			return await Promise.race([
				new Promise(resolve => {
					requestId = requestAnimationFrame(() => {
						insertFunction()
						resolve()
					})
				}),
				new Promise(resolve => onFinish(() => {
					cancelAnimationFrame(requestId)
					insertFunction()
					resolve()
				}))
			])
		}
	}

	getCharNodesArray(charNodeData) {
		return charNodeData.children.map(child => {
			child.setAttribute('transform', `${charNodeData.transform} translate(${charNodeData.position.x}, ${charNodeData.position.y - charNodeData.height + 10})`)
			child.setAttribute('data-type', 'text')
			if (charNodeData.long) child.setAttribute('data-paragraph', true)
			if (charNodeData.color) child.setAttribute('stroke', charNodeData.color)
			return { child, reference: charNodeData.reference }
		})
	}

	getSpansCharData(spanData) {
		const subtasks = []
		spanData.text.textContent.split('').forEach((char, index) => {
			if (char === ' ')
				return
			subtasks.push(() => ({
				...spanData,
				height: this.charsMap[char].viewBox.split(' ').pop(),
				position: spanData.text.getStartPositionOfChar(index), // SVG must be part of DOM for this function?!
				children: Array.from(this.charsMap[char].node.cloneNode(true).children),
			}))
		})
		return subtasks
	}

	getTextNodeData(node) {
		const tspans = Array.from(node.querySelectorAll('tspan'))
		const data = {
			transform: node.getAttribute('transform'),
			color: node.getAttribute('fill') || undefined,
			reference: node,
			long: tspans.length ? 40 < node.getNumberOfChars() + tspans.length - 1 : false,
		}
		if (tspans.length)
			return tspans.map(tspan => Object.assign({}, data, { 
				text: tspan,
				color: tspan.getAttribute('fill') || data.color,
			}))
		return Object.assign(data, { text: node })
	}

	uniqueCharFromNode(node) {
		return Array.from(new Set(
			node.textContent.split('')
				.map(char => char.trim())
				.filter(char => char !== "")
		))
	}

	charDisambiguation(char) {
		return char.toLowerCase()
			.replace(/‘/g, "'")
			.replace(/’/g, "'")
			.replace(/“/g, '"')
			.replace(/”/g, '"')
	}

	getChar(rawChar, stack) {
		const char = this.charDisambiguation(rawChar)
		return async (_, onFinish) => {
			if (!stack.isFinishing)
				onFinish(() => this.Alphabet.finish())
			return [
				rawChar,
				await this.Alphabet.promise.then(() => this.Alphabet.getChar(char))
			]
		}
	}
}