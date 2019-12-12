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

const fetchChars = async () => {
	const response = await fetch(`/data/alphabet.json`)
	const { chars } = await response.json()
	return chars
}

const makeStringifiedCharsMap = (charsData) => {
	const charsMap = {}
	console.log(charsData)
	charsData.forEach(({char, indexedDB}) => charsMap[char] = {
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
			const subtasks = charsList.map((char) => async () => ({
				char,
				indexedDB: await this.IndexedDBManager.getChar(char)
			}))
			stack.next(subtasks)
		})
		.then((charsData, stack) => {
			if(charsData.some(({indexedDB}) => !indexedDB))
				stack.next(() => parseAlphabet(
					charsData.map(({char}) => char),
					stack
				))
				.next(charsMap => {
					this.IndexedDBManager.saveChars(charsMap)
					return charsMap
				})
			else {
				stack.next(() => makeStringifiedCharsMap(charsData))
					.next((charsMap, stack) => {
						const subtasks = Object.values(charsMap).map(reviveCharData)
						stack.next(subtasks)
							.next(() => charsMap)
					})
			}
		})
		.then(charsMap => {
			console.log(charsMap)
			this.charsMap = charsMap
		})
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