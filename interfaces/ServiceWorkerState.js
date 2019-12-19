export default class ServiceWorkerState {
	constructor() {
		if (!!ServiceWorkerState.instance) {
			return ServiceWorkerState.instance;
		}
		ServiceWorkerState.instance = this
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