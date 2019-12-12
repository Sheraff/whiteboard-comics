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

// TODO: make IdleStack more like Promises ?
// - add stuff w/ then()
// - `finish` just cancels / skips all 'requestIdle'
// - make "tree"? one node has array of functions, array of results, link to next node