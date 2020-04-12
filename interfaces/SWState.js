import makeSingleton from '../functions/makeSingleton.js'

export default makeSingleton(class SWState {

	constructor() {
		this.promise = new Promise((resolve, reject) => {
			if(!navigator.serviceWorker) {
				console.error('navigator.serviceWorker: old browser or missing HTTPS connection', navigator.serviceWorker)
				reject('serviceWorker ability not found')
			} else if(navigator.serviceWorker.controller) {
				console.log('SW already setup', navigator.serviceWorker.controller, navigator.serviceWorker.controller.state)
				resolve(navigator.serviceWorker.controller)
			} else {
				navigator.serviceWorker.oncontrollerchange = () => {
					console.log('SW controller change', navigator.serviceWorker.controller, navigator.serviceWorker.controller.state)
					navigator.serviceWorker.controller.onstatechange = e => {
						console.log('SW state change', navigator.serviceWorker.controller, navigator.serviceWorker.controller.state)
						// "installing" | "installed" | "activating" | "activated" | "redundant"
						if(navigator.serviceWorker.controller.state === 'activated')
							resolve(navigator.serviceWorker.controller)
					}
				}
			}
		})

		this.portMap = new Map()
	}

	connect(id, target) {
		if(this.portMap.has(`${id}-${target}`))
			return this.portMap.get(`${id}-${target}`)

		const {port1, port2} = new MessageChannel()
		this.promise.then(() => {
			navigator.serviceWorker.controller.postMessage({ port: port1, id, target }, [port1])
		})
		this.portMap.set(`${id}-${target}`, port2)
		return port2
	}
})