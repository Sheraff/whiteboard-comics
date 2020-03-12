import SVGCard from './components/Card.js'
import GridLayout from './components/Grid.js'
// import NotificationPermission from './modules/NotificationPermission.js'

if ('serviceWorker' in navigator && !navigator.serviceWorker.controller)
	navigator.serviceWorker.register('/sw.js', { scope: './' })

customElements.define('svg-card', SVGCard)
customElements.define('grid-layout', GridLayout)

// new NotificationPermission()

// const cards = Array.from(document.querySelectorAll('svg-card'))
// let requestId
// addEventListener('scroll', () => {
// 	if(!requestId)
// 		requestId = requestAnimationFrame(() => {
// 			requestId = undefined
// 			const y = scrollY
// 			const h = innerHeight
// 			cards.forEach(card => {
// 				if(y > card.offsetTop + 300 || y < card.offsetTop - h - 300)
// 					card.classList.add('node-down')
// 				else
// 					card.classList.remove('node-down')

// 				if(y > card.offsetTop - 200)
// 					card.classList.add('move-up')
// 				else
// 					card.classList.remove('move-up')

// 				if(y < card.offsetTop - h + 200)
// 					card.classList.add('move-down')
// 				else
// 					card.classList.remove('move-down')
// 			})
// 		})
// })