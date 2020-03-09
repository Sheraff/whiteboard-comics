function matchStaticImageURL(url) {
	const match = url.match(/\/static\/graphs_(.*)\.jpg$/)
	if (!match)
		return
	return match[1]
}

async function fetchStaticImage(CACHE_NAME, url) {
	const cache = await caches.open(CACHE_NAME)
	const cached = await cache.match(url)
	if (!cached)
		return
	return cached
}

class JpegBlobUploader {

	constructor() {
		this.portsMap = new Map()
		this.onMessage = this.onMessage.bind(this)
	}

	listenToMessages(port, id) {
		if (this.portsMap.has(id)) {
			const oldPort = this.portsMap.get(id)
			delete oldPort.onmessage
		}
		this.portsMap.set(id, port)
		port.onmessage = (message) => this.onMessage(message, port)
		port.postMessage('')
	}

	onMessage({ data: { url, data } }, port) {
		if (!url)
			return
		caches.open(CACHE_NAME)
			.then(cache => cache.put(url, new Response(data, {
				status: 200,
				headers: new Headers({
					'Content-Type': 'image/jpeg',
				})
			})).then(() => {
				port.postMessage({ url })
			}))

	}
}