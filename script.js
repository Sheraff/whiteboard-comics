import SVGCard from './components/Card.js'
import GridLayout from './components/Grid.js'
// import NotificationPermission from './modules/NotificationPermission.js'

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

customElements.define('svg-card', SVGCard)
customElements.define('grid-layout', GridLayout)

// new NotificationPermission()