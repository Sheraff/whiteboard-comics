import SVGCard from '/components/Card.js'
import { requestIdleNetwork, idleFetch } from './modules/requestIdleNetwork.js'
import IdleStack from './modules/IdleStack.js'
import { parseChar, parseAlphabet } from './modules/parseAlphabet.js'

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

customElements.define('svg-card', SVGCard)

// parseChar('a')
// parseChar('b')
// parseChar('c')
// parseChar('d')
// parseChar('e')
// parseChar('f').then(console.log)

parseAlphabet().then(console.log)