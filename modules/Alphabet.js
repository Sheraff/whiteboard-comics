/**
 * scenario
 * - fetch json data
 * - get parsed letters from indexedDB
 *      => if a letter is missing, call parseAlphabet
 *      => store parsed letters in indexedDB
 * - put defs in document.body
 */

import IndexedDBManager from '../interfaces/IndexedDB.js'
import IdlePromise from './IdlePromise.js'
import IdleNetwork from '../interfaces/IdleNetwork.js'
const svgNS = 'http://www.w3.org/2000/svg'

export default class Alphabet {
	constructor() {
		if (!!Alphabet.instance)
			return Alphabet.instance
		Alphabet.instance = this
		this.IndexedDBManager = new IndexedDBManager()
		this.idlePromise = new IdlePromise(this.work.bind(this))
	}

	finish() {
		this.idlePromise.finish()
		return this.idlePromise
	}

	get promise() {
		return this.idlePromise
	}

	getChar(char) {
		return this.charsMap[char]
	}

	async * work(resolve, reject) {
		const idleNetwork = new IdleNetwork()
		const { chars } = await idleNetwork.race(`/data/alphabet.json`, { streamType: 'json' })
		
		yield
		// getCharFromIndexed
		const charsData = await Promise.all(chars.map(async ([name, string]) => {
			const indexedDB = await this.IndexedDBManager.getChar(string)
			return { name, string, indexedDB }
		}))

		yield
		this.charsMap = {}
		if (charsData.some(({ indexedDB }) => !indexedDB)) {
			const urgent = yield
			const serialized = await fetchSerializedXML(charsData, urgent, this.idlePromise)
			yield 2
			const fragments = serialized.map(makeDomFragments, 10)
			yield 3
			const elements = fragments.map(extractElements).flat()
			yield 5
			elements.forEach(element => getClipsAndPaths(element, this.charsMap))
			yield 4
			Object.values(this.charsMap).forEach(charData => charData.node = makeCharsElements(charData))
			yield
			Object.entries(this.charsMap).forEach(([string, data]) => {
				const { clips, node, viewBox, name } = data
				this.charsMap[string] = { clips, node, viewBox, name }
			})
			yield
			this.IndexedDBManager.saveChars(this.charsMap)
		} else {
			yield 2
			// makeStringifiedCharsMap
			charsData.forEach(({ name, string, indexedDB }) => this.charsMap[string] = { ...indexedDB, name, string })

			yield
			// reviveCharData
			Object.values(this.charsMap).forEach(charData => {
				var domparser = new DOMParser()
				const nodeFragment = domparser.parseFromString(charData.node, 'image/svg+xml')
				charData.node = nodeFragment.firstChild
				charData.clips = charData.clips.map(clip => domparser.parseFromString(clip, 'image/svg+xml').firstChild)
			})
		}

		yield
		const fragment = new DocumentFragment()
		const svg = document.createElementNS(svgNS, 'svg')
		svg.setAttribute('id', 'defs')
		const defs = document.createElementNS(svgNS, 'defs')

		yield
		Object.values(this.charsMap).forEach(({ clips }) => clips.forEach(clip => defs.appendChild(clip)))

		yield
		svg.appendChild(defs)
		fragment.appendChild(svg)
		document.getElementById("dom-tricks").appendChild(fragment)
		document.body.classList.add('svg-defs')

		resolve()
	}
}



const fetchSerializedXML = (charsData, urgent, idlePromise) => {
	const idleNetwork = new IdleNetwork()
	return Promise.all(charsData.map(async ({ name, string }) => {
		let serializedXML
		const charURL = `/alphabet/alphabet_${name}.svg`
		if (urgent) {
			serializedXML = await idleNetwork.race(charURL)
		} else {
			let idleRequestId
			serializedXML = await Promise.race([
				new Promise(resolve => {
					idleRequestId = idleNetwork.requestIdleNetwork(charURL, resolve)
				}),
				new Promise(resolve => idlePromise.onUrgent = async () => {
					const cancelable = idleNetwork.cancelIdleNetwork(idleRequestId)
					if (cancelable)
						resolve(await idleNetwork.race(charURL))
				})
			])
		}
		return { name, string, serializedXML }
	}))
}

const makeDomFragments = ({ name, string, serializedXML }) => {
	var domparser = new DOMParser()
	const fragment = domparser.parseFromString(serializedXML, 'image/svg+xml')
	const viewBox = fragment.querySelector('svg').getAttribute('viewBox')
	return {
		groups: fragment.querySelectorAll('svg>g'),
		name,
		string,
		viewBox
	}
}

// for each {groups, char} from makeDomFragments
const extractElements = ({ groups, name, string, viewBox }) => (
	// for each group in groups
	Array.from(groups).map((group, index) => {
		// return function that extract elements
		const clip = group.querySelector('defs>path')
		const path = group.lastElementChild
		const id = `${name}_${index}`
		clip.removeAttribute('id')
		path.setAttribute('clip-path', `url(#${id})`)
		return { name, string, clip, path, id, viewBox }
	})
)

const getClipsAndPaths = ({ id, clip, name, string, path, viewBox }, charsMap) => {
	const clipPath = document.createElementNS(svgNS, 'clipPath')
	clipPath.setAttribute('id', id)
	clipPath.appendChild(clip)

	charsMap[string] = charsMap[string] || { id, viewBox, name, paths: [], clips: [] }
	charsMap[string].paths.push(path)
	charsMap[string].clips.push(clipPath)
}

const makeCharsElements = ({ paths, viewBox }) => {
	const fragment = new DocumentFragment()
	const charSvg = document.createElementNS(svgNS, 'svg')
	charSvg.setAttribute('viewBox', viewBox)
	fragment.appendChild(charSvg)
	paths.forEach(path => charSvg.appendChild(path))
	return charSvg
}