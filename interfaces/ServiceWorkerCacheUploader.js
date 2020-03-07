import ServiceWorkerState from './ServiceWorkerState.js'
const CACHE_NAME = 'whiteboard-files-cache-v0'

export default class ServiceWorkerCacheUploader {
	constructor() {
		if (!!ServiceWorkerCacheUploader.instance)
			return ServiceWorkerCacheUploader.instance
		ServiceWorkerCacheUploader.instance = this

		console.log('SW ServiceWorkerCacheUploader instanciated')

		this.ServiceWorkerState = new ServiceWorkerState()
		this.port = this.ServiceWorkerState.connect('ServiceWorkerCacheUploader', 'cacheUploader')
		this.port.onmessage = (e) => {
			this.ready = true
			delete this.port.onmessage
			this.backlog.forEach((data, url) => {
				this.send(url, data)
			})
			delete this.backlog
		}

		this.backlog = new Map()
	}

	put(url, data) {
		if (this.ready)
			this.send(url, data)
		else
			this.backlog.set(url, data)
	}

	has(url) {
		if(this.keys)
			return Promise.resolve(this.keys.has(url))
		return new Promise(async resolve => {
			const cache = await caches.open(CACHE_NAME)
			this.keys = new Set(await cache.keys())
			resolve(this.keys.has(url))
		})
	}

	send(url, data) {
		this.port.postMessage({ url, data })
		if(this.keys)
			this.keys.add(url)
	}
}