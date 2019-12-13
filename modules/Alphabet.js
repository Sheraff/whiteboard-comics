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
const svgNS = 'http://www.w3.org/2000/svg'

async function fetchChars() {
	const response = await fetch(`/data/alphabet.json`)
	const { chars } = await response.json()
	return chars
}

function getCharFromIndexed(char) {
	return async () => {
		const indexedDB = await this.IndexedDBManager.getChar(char)
		return {
			char, indexedDB
		}
	}
}

function makeStringifiedCharsMap(charsData) {
	const charsMap = {}
	charsData.forEach(({ char, indexedDB }) => charsMap[char] = {
		node: indexedDB.node,
		clips: indexedDB.clips
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
			.then((charsList, stack) => {
				const subtasks = charsList.map(getCharFromIndexed.bind(this))
				stack.next(subtasks)
			}, 1)
			.then((charsData, stack) => {
				if (charsData.some(({ indexedDB }) => !indexedDB)) {
					const charList = charsData.map(({ char }) => char)
					parseAlphabet(charList, stack)
						.then(charsMap => {
							this.IndexedDBManager.saveChars(charsMap)
							return charsMap
						})
				} else {
					stack.then(() => makeStringifiedCharsMap(charsData), 2)
						.then((charsMap, stack) => {
							const subtasks = Object.values(charsMap).map(reviveCharData)
							stack.next(subtasks, 10)
								.next(() => charsMap, 1)
						}, 1)
				}
				stack.then(charsMap => {
					this.charsMap = charsMap
					return charsMap
				}, 1)
					.then((charsData, stack) => {
						const fragment = new DocumentFragment()
						const svg = document.createElementNS(svgNS, 'svg')
						svg.setAttribute('id', 'defs')
						const defs = document.createElementNS(svgNS, 'defs')
						const subtasks = Object.values(charsData).map(({clips}) => () => clips.forEach(clip => defs.appendChild(clip)))
						stack.next(subtasks)
							.next(() => {
								svg.appendChild(defs)
								fragment.appendChild(svg)
								document.body.appendChild(fragment)
								return this
							})
					})
			})
	}

	finish() {
		if(!this.readyPromise)
			this.readyPromise = new Promise((resolve, reject) => {
				this.stack.finish().then(resolve)
			})
		return this.readyPromise
	}

	get promise() {
		return this.stack.promise
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