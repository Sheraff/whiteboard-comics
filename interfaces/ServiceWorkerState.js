class ServiceWorkerState {
	constructor() {
		this.readyPromise = new Promise(resolve => this.readyResolve = resolve)

		if (navigator.serviceWorker) {
			this.isWorkerReady = navigator.serviceWorker
				&& navigator.serviceWorker.controller
				&& navigator.serviceWorker.controller.state === 'activated'

			if (!this.isWorkerReady) {
				navigator.serviceWorker.addEventListener('message', () => {
					this.isWorkerReady = true
					this.readyResolve()
				}, { once: true })
			} else {
				this.readyResolve()
			}
		}
	}

	get isReady() {
		return this.isWorkerReady
	}

	then(resolve) {
		return this.readyPromise.then(resolve)
	}
}

export default class Singleton {
	static singleton
	constructor() {
		if (!Singleton.singleton)
			Singleton.singleton = new ServiceWorkerState()
		return Singleton.singleton
	}
}