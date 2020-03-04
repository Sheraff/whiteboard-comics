import Alphabet from './Alphabet.js'
import IdlePromise from './IdlePromise.js'

export default class TextToAlphabet {

	constructor(svg) {
		this.Alphabet = new Alphabet()
		this.svg = svg

		this.idlePromise = new IdlePromise(this.run.bind(this))
		this.idlePromise.addUrgentListener(() => console.log('urgent TextToAlphabet'))

		return this.idlePromise
	}

	async * run(resolve) {
		if (this.svg.ownerDocument !== document || !this.svg.isConnected) {
			yield
			this.tempnode = this.insertIntoDOM(this.svg)
		}

		yield
		const charSet = this.uniqueCharFromNode(this.svg)

		yield
		this.charMap = new Map()
		await Promise.all(charSet.map(async char => {
			this.charMap.set(char, await this.getChar(char, this.idlePromise))
		}))

		await document.fonts.load('1em Permanent Marker')

		yield
		const texts = Array.from(this.svg.querySelectorAll('text'))
		const textNodesData = texts.map(text => this.getTextNodeData(text)).flat()

		const charNodesData = []
		for (let nodeData of textNodesData) {
			yield
			charNodesData.push(...this.getSpansCharData(nodeData))
		}

		yield
		const charsNodesChilren = charNodesData.map(nodeData => this.getCharNodesArray(nodeData)).flat()

		const referencesMap = new Map()
		for (let { child, reference } of charsNodesChilren) {
			yield
			if (!referencesMap.has(reference))
				referencesMap.set(reference, new DocumentFragment())
			referencesMap.get(reference).appendChild(child)
		}

		for (let [reference, fragment] of referencesMap) {
			yield
			await this.placeFragmentBeforeRef(reference, fragment, this.idlePromise)
		}

		resolve()

		delete this.svg
		if (this.temp)
			document.getElementById("dom-tricks").removeChild(this.temp)
	}

	async placeFragmentBeforeRef(reference, fragment, idlePromise) {
		const insertFunction = () => reference.parentNode.insertBefore(fragment, reference)

		if (idlePromise.urgent)
			return insertFunction()

		let idleRequestId
		return await Promise.race([
			new Promise(resolve => {
				idleRequestId = requestAnimationFrame(() => {
					insertFunction()
					resolve()
				})
			}),
			new Promise(resolve => idlePromise.addUrgentListener(() => {
				cancelAnimationFrame(idleRequestId)
				insertFunction()
				resolve()
			}))
		])
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

	getSpansCharData(nodeData) {
		return nodeData.text.textContent.split('')
			.map((char, index) => {
				if (char === ' ')
					return
				const height = this.charMap.get(char).viewBox.split(' ').pop()
				const children = Array.from(this.charMap.get(char).node.cloneNode(true).children)
				try {
					const position = nodeData.text.getStartPositionOfChar(index) // SVG must be part of DOM for this function?!
					return { ...nodeData, height, position, children }
				} catch (e) {
					console.error(e, nodeData, nodeData.reference.textContent, nodeData.text.textContent, `char ${char}`, index, nodeData.reference.closest('svg'))
				}
			})
			.filter(data => !!data)
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

	charDisambiguation(char) {
		return char.toLowerCase()
			.replace(/‘/g, "'")
			.replace(/’/g, "'")
			.replace(/“/g, '"')
			.replace(/”/g, '"')
	}

	async getChar(rawChar, idlePromise) {
		const char = this.charDisambiguation(rawChar)
		idlePromise.addUrgentListener(() => this.Alphabet.urgent(char))
		return await this.Alphabet.get(char)
	}

	uniqueCharFromNode(node) {
		return Array.from(new Set(
			node.textContent.split('')
				.map(char => char.trim())
				.filter(char => char !== "")
		))
	}

	insertIntoDOM(node) {
		const container = document.createElement('div')
		container.classList.add('svg-card')
		container.appendChild(node)
		document.getElementById("dom-tricks").appendChild(container)
		return container
	}
}