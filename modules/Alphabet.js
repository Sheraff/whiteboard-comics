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

async function fetchChars() {
	const response = await fetch(`/data/alphabet.json`)
	const { chars } = await response.json()
	return chars
}

function makeStringifiedCharsMap(charsData) {
	const charsMap = {}
	charsData.forEach(({ char, indexedDB }) => charsMap[char] = {
		node: indexedDB.node,
		clips: JSON.parse(indexedDB.clips)
	})
	return charsMap
}

const reviveCharData = (charData) => () => {
	const range = new Range()

	const nodeFragment = range.createContextualFragment(charData.node)
	charData.node = nodeFragment.firstChild

	charData.clips = charData.clips.map(clip => range.createContextualFragment(clip).firstChild)
}

class Alphabet {
	constructor() {
		this.IndexedDBManager = new IndexedDBManager()
		this.stack = new IdleStack(fetchChars)
			.then((charsList, stack) => {
				const subtasks = charsList.map((char) => async () => {
					const indexedDB = await this.IndexedDBManager.getChar(char)
					return {
						char, indexedDB
					}
				})
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
							stack.next(subtasks)
								.next(() => charsMap)
						}, 1)
				}
				stack.then(charsMap => {
					this.charsMap = charsMap
					return charsMap
				}, 1)
			})

		this.stack.finish().then(console.log)
	}
}

let singleton

export default class {
	constructor() {
		if (!singleton)
			singleton = new Alphabet()
		return singleton
	}
}