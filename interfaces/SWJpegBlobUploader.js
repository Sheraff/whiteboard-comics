import SWState from './SWState.js'
const CACHE_NAME = 'whiteboard-files-cache-v0'

export default class SWJpegBlobUploader {
	constructor() {
		if (!!SWJpegBlobUploader.instance)
			return SWJpegBlobUploader.instance
		SWJpegBlobUploader.instance = this

		this.SWState = new SWState()
		this.port = this.SWState.connect('SWJpegBlobUploader', 'jpegBlobUploader')
		this.port.onmessage = (e) => {
			this.ready = true
			this.listenToResponses()
			this.backlog.forEach((data, url) => {
				this.send(url, data)
			})
			delete this.backlog
		}

		this.backlog = new Map()
		this.callbacks = new Map()
	}

	listenToResponses() {
		this.port.onmessage = ({ data: { url } }) => {
			if (this.callbacks.has(url)) {
				this.callbacks.get(url).forEach(callback => callback(url))
				this.callbacks.delete(url)
			}
		}
	}

	put(url, data, callback) {
		if (callback) {
			const array = this.callbacks.get(url) || []
			array.push(callback)
			this.callbacks.set(url, array)
		}
		if (this.ready)
			this.send(url, data)
		else
			this.backlog.set(url, data)
	}

	has(url) {
		return new Promise(async resolve => {
			const cache = await caches.open(CACHE_NAME)
			const keys = await cache.keys(url, {
				ignoreSearch: true,
				ignoreMethod: true
			})
			resolve(Boolean(keys.length))
		})
	}

	send(url, data) {
		this.port.postMessage({ url, data }, [data])
	}
}