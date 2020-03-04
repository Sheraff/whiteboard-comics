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

		this.charsMap = new Map()
		this.run()
	}

	urgent(key) {
		this.charsMap.get(key).finish()
	}

	get(key) {
		return this.charsMap.get(key)
	}

	async run() {
		const idleNetwork = new IdleNetwork()
		const { chars } = await idleNetwork.race(`/data/alphabet.json`, { streamType: 'json' })

		chars.forEach(([name, string]) => {
			const idlePromise = new IdlePromise((async function* (resolve) {
				const charData = { name, string }

				yield
				const indexedDBManager = new IndexedDBManager()
				const indexedDbCharData = await indexedDBManager.getChar(string)
				if (!indexedDbCharData) {
					yield
					const serialized = await this.fetchSerializedXML(name, idlePromise)
					yield
					const { groups, viewBox } = this.makeDomFragments(serialized)
					charData.viewBox = viewBox
					yield
					const elements = this.extractElements(groups)
					yield
					const { clips, paths } = this.makeClipsAndLinkPaths(name, elements)
					charData.clips = clips
					yield
					const node = this.makeCharSvg(paths, viewBox)
					charData.node = node
				} else {
					charData.viewBox = indexedDbCharData.viewBox
					yield
					const { node, clips } = this.revivifyIndexedXML(indexedDbCharData.node, indexedDbCharData.clips)
					charData.clips = clips
					charData.node = node
				}

				yield
				if(!this.defs) {
					const fragment = new DocumentFragment()
					const svg = document.createElementNS(svgNS, 'svg')
					svg.setAttribute('id', 'defs')
					this.defs = document.createElementNS(svgNS, 'defs')
					svg.appendChild(this.defs)
					fragment.appendChild(svg)
					document.getElementById("dom-tricks").appendChild(fragment)
					document.body.classList.add('svg-defs')
				}

				yield
				this.appendClipsToDefs(charData.clips, this.defs)

				resolve(charData)

				if (!indexedDbCharData)
					indexedDBManager.saveChar(charData)
			}).bind(this))

			idlePromise.addUrgentListener(() => console.log('urgent Alphabet'))
			this.charsMap.set(string, idlePromise)
		})
	}

	async fetchSerializedXML(name, idlePromise) {
		const idleNetwork = new IdleNetwork()
		const URL = `/alphabet/alphabet_${name}.svg`

		if (idlePromise.urgent)
			return idleNetwork.race(URL)

		let idleRequestId
		return await Promise.race([
			new Promise(resolve => {
				idleRequestId = idleNetwork.requestIdleNetwork(URL, resolve)
			}),
			new Promise(resolve => idlePromise.addUrgentListener(() => {
				const cancelable = idleNetwork.cancelIdleNetwork(idleRequestId)
				if (cancelable)
					resolve(idleNetwork.race(URL))
			}))
		])
	}

	makeDomFragments(serializedXML) {
		const domparser = new DOMParser()
		const fragment = domparser.parseFromString(serializedXML, 'image/svg+xml')
		return {
			groups: Array.from(fragment.querySelectorAll('svg>g')),
			viewBox: fragment.querySelector('svg').getAttribute('viewBox'),
		}
	}

	extractElements(groups) {
		return groups.map(group => {
			const clip = group.querySelector('defs>path')
			const path = group.lastElementChild
			return { clip, path }
		})
	}

	makeClipsAndLinkPaths(name, elements) {
		const paths = []
		const clips = []

		elements.forEach(({ clip, path }, index) => {
			const clipPath = document.createElementNS(svgNS, 'clipPath')
			const id = `${name}_${index}`
			clip.removeAttribute('id')
			path.setAttribute('clip-path', `url(#${id})`)
			clipPath.setAttribute('id', id)
			clipPath.appendChild(clip)
			paths.push(path)
			clips.push(clipPath)
		})

		return { paths, clips }
	}

	makeCharSvg(paths, viewBox) {
		const fragment = new DocumentFragment()
		const charSvg = document.createElementNS(svgNS, 'svg')
		charSvg.setAttribute('viewBox', viewBox)
		fragment.appendChild(charSvg)
		paths.forEach(path => charSvg.appendChild(path))
		return charSvg
	}

	revivifyIndexedXML(serializedNode, serializedClips) {
		const domparser = new DOMParser()
		const node = domparser.parseFromString(serializedNode, 'image/svg+xml').firstChild
		const clips = serializedClips.map(clip => domparser.parseFromString(clip, 'image/svg+xml').firstChild)
		return { node, clips }
	}

	appendClipsToDefs(clips, defs) {
		const fragment = new DocumentFragment()
		clips.forEach(clip => fragment.appendChild(clip))
		defs.appendChild(fragment)
	}
}