class CacheUploader {

	constructor() {
		this.portsMap = new Map()
		this.onMessage = this.onMessage.bind(this)
	}

	listenToMessages(port, id) {
		console.log('SW CacheUploader listenToMessages', id, port)
		if (this.portsMap.has(id)) {
			const oldPort = this.portsMap.get(id)
			delete oldPort.onmessage
		}
		this.portsMap.set(id, port)
		port.onmessage = (message) => this.onMessage(message, port)
		port.postMessage('')
	}

	onMessage({ data: { url, data } }, port) {
		if(!url)
			return
		caches.open(CACHE_NAME)
			.then(cache => cache.put(url, new Response(this.dataURItoBlob(data), {
				status: 200,
				type: 'basic',
				headers: new Headers({
					'Content-Type': 'image/png'
				})
			})))
	}

	dataURItoBlob(dataURI) {
		// https://stackoverflow.com/questions/12168909/blob-from-dataurl/12300351#12300351

		// convert base64 to raw binary data held in a string
		// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
		const byteString = atob(dataURI.split(',')[1])
	  
		// separate out the mime component
		const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
	  
		// write the bytes of the string to an ArrayBuffer
		const ab = new ArrayBuffer(byteString.length)
	  
		// create a view into the buffer
		const ia = new Uint8Array(ab)
	  
		// set the bytes of the buffer to the correct values
		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i)
		}
	  
		// write the ArrayBuffer to a blob, and you're done
		return new Blob([ab], {type: mimeString})
	  
	  }
}