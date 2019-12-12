import IdleStack from '/modules/IdleStack.js'

export async function parseAlphabet() {
	const response = await fetch(`/data/alphabet.json`)
	const {chars} = await response.json()
	Promise.all(chars.map(parseChar))
	.then(results => {
		const fragment = document.createDocumentFragment()
		const svg = document.createElement('svg')
		svg.setAttribute('id', 'defs')
		const defs = document.createElement('defs')
		svg.appendChild(defs)
		fragment.appendChild(svg)
		results.forEach(result => {
			result.forEach(group => {
				const clipPath = document.createElement('clipPath')
				clipPath.setAttribute('id', group.id)
				clipPath.appendChild(group.clip)
				defs.appendChild(clipPath)
			})
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
		const fragment = document.createRange().createContextualFragment(serializedHTML)
		const groups = fragment.querySelectorAll('svg>g')
		groups.forEach((group, index) => {
			stack.push((result = []) =>  {
				const clip = group.querySelector('defs>path')
				const path = group.lastElementChild
				const id = `${char}_${index}`
				clip.removeAttribute('id')
				path.setAttribute('clip-path', `url(#${id})`)
				result.push({ char, clip, path, id, group })

				return result
			})
		})
	})
	return stack
}