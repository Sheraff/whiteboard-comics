/**
 * scenario
 * - fetch json data
 * - get parsed letters from indexedDB
 *      => if a letter is missing, call parseAlphabet
 *      => store parsed letters in indexedDB
 * - put defs in document.body
 */

import IndexedDBManager from '/modules/IndexedDB.js'
import { parseAlphabet } from '/modules/parseAlphabet.js'
import IdleStack from '/modules/IdleStack.js'
import IdleNetwork from '/modules/IdleNetwork.js'
const svgNS = 'http://www.w3.org/2000/svg'

async function fetchChars() {
	const idleNetwork = new IdleNetwork()
	const response = await idleNetwork.race(`/data/alphabet.json`)
	const { chars } = await response.json()
	return chars
}

function getCharFromIndexed([name, string]) {
	return async () => {
		const indexedDB = await this.IndexedDBManager.getChar(string)
		return {
			name, string, indexedDB
		}
	}
}

function makeStringifiedCharsMap(charsData) {
	const charsMap = {}
	charsData.forEach(({ name, string, indexedDB }) => charsMap[string] = {
		node: indexedDB.node,
		clips: indexedDB.clips,
		name
	})
	return charsMap
}

const reviveCharData = (charData) => () => {
	var domparser = new DOMParser()
	const nodeFragment = domparser.parseFromString(charData.node, 'image/svg+xml')
	charData.node = nodeFragment.firstChild
	charData.clips = charData.clips.map(clip => domparser.parseFromString(clip, 'image/svg+xml').firstChild)
}

class Alphabet {
	constructor() {
		this.IndexedDBManager = new IndexedDBManager()
		this.stack = new IdleStack(fetchChars)
			.then((charsList) => {
				const subtasks = charsList.map(getCharFromIndexed.bind(this))
				this.stack.next(subtasks)
			}, 1)
			.then((charsData) => {
				if (charsData.some(({ indexedDB }) => !indexedDB)) {
					parseAlphabet(charsData, this.stack)
						.then(charsMap => {
							this.IndexedDBManager.saveChars(charsMap)
							return charsMap
						})
				} else {
					this.stack.then(() => makeStringifiedCharsMap(charsData), 2)
						.then((charsMap) => {
							const subtasks = Object.values(charsMap).map(reviveCharData)
							this.stack.next(subtasks, 10)
								.next(() => charsMap, 1)
						}, 1)
				}
				this.stack.then(charsMap => {
					this.charsMap = charsMap
					return charsMap
				}, 1)
					.then((charsData) => {
						const fragment = new DocumentFragment()
						const svg = document.createElementNS(svgNS, 'svg')
						svg.setAttribute('id', 'defs')
						const defs = document.createElementNS(svgNS, 'defs')
						const subtasks = Object.values(charsData).map(({clips}) => () => clips.forEach(clip => defs.appendChild(clip)))
						this.stack.next(subtasks)
							.next(() => {
								svg.appendChild(defs)
								fragment.appendChild(svg)
								document.getElementById("dom-tricks").appendChild(fragment)
								document.body.classList.add('svg-defs')
								return this
							})
					})
			})
	}

	finish() {
		if(!this.readyPromise)
			this.readyPromise = new Promise(resolve => {
				this.stack.finish().then(resolve)
			})
			// this.readyPromise = this.stack.finish()
		return this.readyPromise
	}

	get promise() {
		return this.stack.promise
	}

	getChar(char) {
		return this.charsMap[char]
	}
}


export default class Singleton {
	static singleton
	constructor() {
		if (!Singleton.singleton)
			Singleton.singleton = new Alphabet()
		return Singleton.singleton
	}
}