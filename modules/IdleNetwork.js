import ServiceWorkerInit from '/modules/ServiceWorkerInit.js'

class IdleNetwork {
	constructor() {
		this.ServiceWorkerInit = new ServiceWorkerInit()
		this.backlog = []
		this.isListening = false
		this.id = 0

		this.ServiceWorkerInit.then(this.processBacklog.bind(this))
	}

	async findInCache(request) {
		return await caches.match(request)
	}

	processBacklog() {
		if (this.isListening)
			return

		this.isListening = true
		navigator.serviceWorker.addEventListener('message', ({ data }) => {
			requestIdleCallback(() => {
				this.isListening = false
				if (data.idle && data.availableConnections > 0)
					this.manyRequests(data.availableConnections)
				else
					this.processBacklog()
			})
		}, { once: true })
		navigator.serviceWorker.controller.postMessage({ idleRequest: true })
	}

	manyRequests(number) {
		for (let count = number; count > 0; count--) {
			if (!this.makeRequest())
				break
		}
	}

	makeRequest() {
		requestIdleCallback(() => {
			if (!this.backlog.length)
				return false
			const { request, callback, resolve, reject } = this.backlog.shift()
			if (typeof callback === 'function')
				fetch(request).then(callback).finally(this.processBacklog.bind(this))
			else
				fetch(request).catch(reject).then(resolve).finally(this.processBacklog.bind(this))
			return true
		})
	}

	cancelIdleNetwork(id) {
		const index = this.backlog.findIndex(item => item.id === id)
		if (index === -1)
			return false
		this.backlog.splice(index, 1)
		return true
	}

	requestIdleNetwork(request, callback) {
		if (!this.ServiceWorkerInit.isReady) {
			const requestId = ++this.id
			this.findInCache(request).then(result => {
				if (result)
					callback(result)
				else {
					this.backlog.push({ id: requestId, request, callback })
					if (this.ServiceWorkerInit.isReady)
						this.processBacklog()
				}
			})
			return requestId
		} else {
			this.backlog.push({ id: ++this.id, request, callback })
			this.processBacklog()
			return this.id
		}
	}

	idleFetch(request) {
		return new Promise(async (resolve, reject) => {
			if (!this.ServiceWorkerInit.isReady) {
				const result = await this.findInCache(request)
				if (result)
					resolve(result)
				else {
					this.backlog.push({ request, resolve, reject })
					if (this.ServiceWorkerInit.isReady)
						this.processBacklog()
				}
			} else {
				this.backlog.push({ request, resolve, reject })
				this.processBacklog()
			}
		})
	}
}

export default class Singleton {
	static singleton
	constructor() {
		if (!Singleton.singleton)
			Singleton.singleton = new IdleNetwork()
		return Singleton.singleton
	}
}