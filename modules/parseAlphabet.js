import IdleStack from '/modules/IdleStack.js'

const svgNS = 'http://www.w3.org/2000/svg'

const fetchChars = async () => {
	const response = await fetch(`/data/alphabet.json`)
	const { chars } = await response.json()
	return chars
}

const fetchSerializedHTML = (char) => async () => {
	const response = await fetch(`/alphabet/alphabet_${char}.svg`)
	const serializedHTML = await response.text()
	return { char, serializedHTML }
}

const makeDomFragments = ({ char, serializedHTML }) => {
	const range = new Range()
	const fragment = range.createContextualFragment(serializedHTML)
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
			return { char, clip, path, id, group, viewBox }
		}
	))
)

const makeDefNode = () => {
	const fragment = new DocumentFragment()
	const svg = document.createElementNS(svgNS, 'svg')
	svg.setAttribute('id', 'defs')
	const defs = document.createElementNS(svgNS, 'defs')
	svg.appendChild(defs)
	fragment.appendChild(svg)
	return { fragment, svg, defs }
}

const populateDefsAndChars = ({ charsMap, defs, svg }) => ({ id, clip, char, path, group, viewBox }) => {
	return () => { // 
		const clipPath = document.createElementNS(svgNS, 'clipPath')
		clipPath.setAttribute('id', id)
		clipPath.appendChild(clip)
		defs.appendChild(clipPath)

		charsMap[char] = charsMap[char] || { id, viewBox, paths: [] }
		charsMap[char].paths.push(path)

		return svg
	}
}

const makeCharsElements = ({paths, viewBox}) => {
	const fragment = new DocumentFragment()
	const svg = document.createElementNS(svgNS, 'svg')
	svg.setAttribute('viewBox', viewBox)
	fragment.appendChild(svg)
	paths.forEach(path => svg.appendChild(path))
	return svg
}

export function parseAlphabet() {
	const charsMap = {}
	return new IdleStack(() => fetchChars())
		.then((chars, stack) => {
			stack.next(chars.map(fetchSerializedHTML))
		})
		.then((results) => results.map(makeDomFragments))
		.then((results, stack) => {
			stack.next(results.map(extractElements).flat())
		})
		.then(extractedElements => ({ ...makeDefNode(), extractedElements }))
		.then(({ fragment, svg, defs, extractedElements }, stack) => {
			const mapping = populateDefsAndChars({ charsMap, defs, svg })
			stack.next(extractedElements.map(mapping))
		})
		.then(([svg], stack) => {
			const subtasks = Object.keys(charsMap).map(char => () => charsMap[char] = makeCharsElements(charsMap[char]))
			stack.next(subtasks)
				.next(() => ({
				$definitions: svg,
				charsMap
			}))
		})
}