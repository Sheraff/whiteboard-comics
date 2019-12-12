import IdleStack from '/modules/IdleStack.js'

const svgNS = 'http://www.w3.org/2000/svg'

export async function parseAlphabet() {
	const response = await fetch(`/data/alphabet.json`)
	const {chars} = await response.json()
	Promise.all(chars.map(parseChar))
	.then(results => {
		const fragment = new DocumentFragment()
		const svg = document.createElementNS(svgNS, 'svg')
		svg.setAttribute('id', 'defs')
		const defs = document.createElementNS(svgNS, 'defs')
		svg.appendChild(defs)
		fragment.appendChild(svg)
		results.forEach(result => {
			const fragment = new DocumentFragment()
			const svg = document.createElementNS(svgNS, 'svg')
			svg.setAttributeNS(svgNS, 'viewBox', result[0].viewBox)
			fragment.appendChild(svg)
			result.forEach(item => {
				svg.appendChild(item.path)
				const clipPath = document.createElementNS(svgNS, 'clipPath')
				clipPath.setAttribute('id', item.id)
				clipPath.appendChild(item.clip)
				defs.appendChild(clipPath)
			})
			console.log(fragment)
		})
		// stripAndWrite(`${resultFolder}/defs.svg`, document.body.innerHTML)
		console.log(fragment)
	})
}

export async function parseChar(char) {
	const stack = new IdleStack()
	stack.push(async () => {
		const response = await fetch(`/alphabet/alphabet_${char}.svg`)
		const serializedHTML = await response.text()
		return serializedHTML
	})
	stack.push((serializedHTML) => {
		const range = new Range()
		const fragment = range.createContextualFragment(serializedHTML)
		const viewBox = fragment.querySelector('svg').getAttribute('viewBox')
		const groups = fragment.querySelectorAll('svg>g')
		groups.forEach((group, index) => {
			stack.push((result = []) =>  {
				const clip = group.querySelector('defs>path')
				const path = group.lastElementChild
				const id = `${char}_${index}`
				clip.removeAttribute('id')
				path.setAttribute('clip-path', `url(#${id})`)
				result.push({ char, clip, path, id, viewBox })

				return result
			})
		})
	})
	return stack
}