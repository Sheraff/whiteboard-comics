import SVGCard from '/components/Card.js'
import { parseAlphabet } from './modules/parseAlphabet.js'

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

customElements.define('svg-card', SVGCard)

const stack = parseAlphabet()

const simulateDelay = new Promise(resolve => setTimeout(
	() => resolve(stack.finish())
, 500))

Promise.race([
	stack,
	simulateDelay,
]).then(result => {
	console.log(result)
})

