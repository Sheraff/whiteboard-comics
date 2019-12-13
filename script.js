import SVGCard from '/components/Card.js'
import Alphabet from '/modules/Alphabet.js'

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

customElements.define('svg-card', SVGCard)

window.alphabet = new Alphabet()
window.alphabet.promise.then((alphabet) => {
	console.log(alphabet.getChar('w'))
})
setTimeout(() => {
	window.alphabet.finish().then(console.log)
}, 500)