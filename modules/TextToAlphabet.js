import Alphabet from './Alphabet.js'
import IdlePromise from './IdlePromise.js'

export default class TextToAlphabet {

	constructor(svg, name) {
		this.Alphabet = new Alphabet()
		this.svg = svg
		this.name = name

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
		const charSet = Array.from(TextToAlphabet.uniqueCharFromNode(this.svg))

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
			.map((rawChar, index) => {
				const char = TextToAlphabet.charDisambiguation(rawChar)
				if (char === ' ')
					return
				const height = this.charMap.get(char).viewBox.split(' ').pop()
				const children = Array.from(this.charMap.get(char).node.cloneNode(true).children)
				try {
					const position = nodeData.text.getStartPositionOfChar(index) // SVG must be part of DOM for this function?!
					return { ...nodeData, height, position, children }
				} catch (e) {
					console.error(this.name, e, nodeData, nodeData.reference.textContent, nodeData.text.textContent, `char ${char}`, index, nodeData.reference.closest('svg'))
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

	static charDisambiguation(char) {
		return char.toLowerCase()
			.replace(/‘/g, "'")
			.replace(/’/g, "'")
			.replace(/“/g, '"')
			.replace(/”/g, '"')
			.replace(/\s/g, ' ')
	}

	async getChar(char, idlePromise) {
		idlePromise.addUrgentListener(() => this.Alphabet.urgent(char))
		return await this.Alphabet.get(char)
	}

	static uniqueCharFromNode(node) {
		const chars = node.textContent
			.replace(/\s/g,'')
			.split('')
			.map(TextToAlphabet.charDisambiguation)
		return new Set(chars)
	}

	insertIntoDOM(node) {
		const container = document.createElement('div')
		container.classList.add('svg-card')
		container.appendChild(node)
		document.getElementById('dom-tricks').appendChild(container)
		return container
	}

	static async defineClips(parentIdlePromise, node) {
		const alphabet = new Alphabet()
		const idlePromise = new IdlePromise(async function* (resolve) {
			const promises = []

			yield
			const charSet = TextToAlphabet.uniqueCharFromNode(node)

			for(const char of charSet) {
				const promise = alphabet.get(char)
				idlePromise.addUrgentListener(promise.finish)
				promises.push(promise)
				yield
			}

			await Promise.all(promises)
			resolve()
		})
		
		parentIdlePromise.addUrgentListener(idlePromise.finish)

		return idlePromise
	}
}