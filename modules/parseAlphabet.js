import IdleNetwork from '/modules/IdleNetwork.js'

const svgNS = 'http://www.w3.org/2000/svg'

const fetchSerializedXML = (charsData, stack) => {
	const idleNetwork = new IdleNetwork()
	return async () => await Promise.all(charsData.map(async ({ name, string }) => {
		let response
		const charURL = `/alphabet/alphabet_${name}.svg`
		if (stack.isFinishing) {
			response = await fetch(charURL)
		} else {
			let idleRequestId
			response = await Promise.race([
				new Promise(resolve => {
					idleRequestId = idleNetwork.requestIdleNetwork(charURL, resolve)
				}),
				new Promise(resolve => stack.onFinish(async () => {
					const cancelable = idleNetwork.cancelIdleNetwork(idleRequestId)
					if (cancelable)
						resolve(await fetch(charURL))
				}))
			])
		}
		const serializedXML = await response.text()
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
	Array.from(groups).map((group, index) => (
		// return function that extract elements
		() => {
			const clip = group.querySelector('defs>path')
			const path = group.lastElementChild
			const id = `${name}_${index}`
			clip.removeAttribute('id')
			path.setAttribute('clip-path', `url(#${id})`)
			return { name, string, clip, path, id, viewBox }
		}
	))
)

const getClipsAndPaths = charsMap => ({ id, clip, name, string, path, viewBox }) => {
	return () => { // 
		const clipPath = document.createElementNS(svgNS, 'clipPath')
		clipPath.setAttribute('id', id)
		clipPath.appendChild(clip)

		charsMap[string] = charsMap[string] || { id, viewBox, name, paths: [], clips: [] }
		charsMap[string].paths.push(path)
		charsMap[string].clips.push(clipPath)
	}
}

const makeCharsElements = ({ paths, viewBox }) => {
	const fragment = new DocumentFragment()
	const charSvg = document.createElementNS(svgNS, 'svg')
	charSvg.setAttribute('viewBox', viewBox)
	fragment.appendChild(charSvg)
	paths.forEach(path => charSvg.appendChild(path))
	return charSvg
}

export function parseAlphabet(charsData, stack) {
	return stack
		.then(() => {
			stack.next(fetchSerializedXML(charsData, stack), 2)
		}, 1)
		.then((results) => results.map(makeDomFragments), 12)
		.then((results, stack) => {
			stack.next(results.map(extractElements).flat(), 3)
		}, 1)
		.then((extractedElements, stack) => {
			const charsMap = {}
			stack.next(extractedElements.map(getClipsAndPaths(charsMap)), 5)
				.next(() => charsMap)
		}, 1)
		.then((charsMap, stack) => {
			const subtasks = Object.values(charsMap).map(charData => () => charData.node = makeCharsElements(charData))
			stack.next(subtasks, 4)
				.next(() => Object.keys(charsMap).forEach(string => {
					const { clips, node, viewBox, name } = charsMap[string]
					charsMap[string] = { clips, node, viewBox, name }
				}))
				.next(() => charsMap)
		}, 1)
}