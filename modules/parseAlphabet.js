import IdleStack from '/modules/IdleStack.js'

export async function parseAlphabet() {
    const response = await fetch(`/data/alphabet.json`)
    const {chars} = await response.json()
    Promise.all(chars.map(parseChar))
    .then(console.log)
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
                result.push({ char, clip, path, id })

                return result
            })
        })
    })
    return stack
}