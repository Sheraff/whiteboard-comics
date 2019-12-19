import ServiceWorkerState from '../interfaces/ServiceWorkerState.js'

export default class NotificationPermission {
	constructor() {
		this.ServiceWorkerState = new ServiceWorkerState()

		requestIdleCallback(() => {
			const visits = +localStorage.getItem('visits')
			localStorage.setItem('visits', visits + 1)

			this.ServiceWorkerState.then(() => {
				if (visits > 2)
					Notification.requestPermission(status => {
						if (status === 'granted') {
							navigator.serviceWorker.controller.postMessage({ notifications: true })
						}
					})
			})
		})
	}
}
