import SVGCard from '/components/Card.js'
import { requestIdleNetwork, idleFetch } from './modules/requestIdleNetwork.js'
import IdleStack from './modules/IdleStack.js'

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

customElements.define('svg-card', SVGCard)

const stack = new IdleStack()