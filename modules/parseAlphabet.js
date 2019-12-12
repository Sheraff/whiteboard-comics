const svgNS = 'http://www.w3.org/2000/svg'

const fetchSerializedXML = (char) => async () => {
	const response = await fetch(`/alphabet/alphabet_${char}.svg`)
	const serializedXML = await response.text()
	return { char, serializedXML }
}

const makeDomFragments = ({ char, serializedXML }) => {
	var domparser = new DOMParser()
	const fragment = domparser.parseFromString(serializedXML, 'image/svg+xml')
	const viewBox = fragment.querySelector('svg').getAttribute('viewBox')
	return {
		groups: fragment.querySelectorAll('svg>g'),
		char,
		viewBox
	}
}

// for each {groups, char} from makeDomFragments
const extractElements = ({ groups, char, viewBox }) => (
	// for each group in groups
	Array.from(groups).map((group, index) => (
		// return function that extract elements
		() => {
			const clip = group.querySelector('defs>path')
			const path = group.lastElementChild
			const id = `${char}_${index}`
			clip.removeAttribute('id')
			path.setAttribute('clip-path', `url(#${id})`)
			return { char, clip, path, id, viewBox }
		}
	))
)

const getClipsAndPaths = charsMap => ({ id, clip, char, path, viewBox }) => {
	return () => { // 
		const clipPath = document.createElementNS(svgNS, 'clipPath')
		clipPath.setAttribute('id', id)
		clipPath.appendChild(clip)

		charsMap[char] = charsMap[char] || { id, viewBox, paths: [], clips: [] }
		charsMap[char].paths.push(path)
		charsMap[char].clips.push(clipPath)
	}
}

const makeCharsElements = ({paths, viewBox}) => {
	const fragment = new DocumentFragment()
	const charSvg = document.createElementNS(svgNS, 'svg')
	charSvg.setAttribute('viewBox', viewBox)
	fragment.appendChild(charSvg)
	paths.forEach(path => charSvg.appendChild(path))
	return charSvg
}

export function parseAlphabet(charsArray, stack) {
	return stack
		.then(() => {
			stack.next(charsArray.map(fetchSerializedXML), 2)
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
				.next(() => Object.keys(charsMap).forEach(char => {
					const {clips, node} = charsMap[char]
					charsMap[char] = {clips, node}
				}))
				.next(() => charsMap)
		}, 1)
}