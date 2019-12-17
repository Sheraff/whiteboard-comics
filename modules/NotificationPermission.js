import ServiceWorkerInit from './ServiceWorkerInit.js'

export default class NotificationPermission {
	constructor() {
		this.ServiceWorkerInit = new ServiceWorkerInit()

		requestIdleCallback(() => {
			const visits = +localStorage.getItem('visits')
			localStorage.setItem('visits', visits + 1)

			this.ServiceWorkerInit.then(() => {
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
