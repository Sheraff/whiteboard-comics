// calls to serviceWorkerState should be postMessages to workerState.port given by:
// [port1, port2] = new MessageChannel()
// worker1.postMessage({port: port1}, [port1])
// worker2.postMessage({port: port2}, [port2])

const workerState = {
	// ServiceWorkerState: new ServiceWorkerState(),
	backlog: [],
	isListening: false,
	id: 0,
}

workerState.ServiceWorkerState.then(() => {
	navigator.serviceWorker.removeEventListener('message', onMessage)
	workerState.isListening = false
	processBacklog()
})

function fetchInCache(request) {
	if (!self.caches)
		return Promise.reject()
	return caches.match(request)
}

async function race(request) {
	if (workerState.ServiceWorkerState.isReady || !self.caches)
		return fetch(request)
	else
		return new Promise((resolve, reject) => {
			let otherFailed = false
			let resolved = false
			fetch(request)
				.catch(() => {
					if (otherFailed)
						reject()
					else
						otherFailed = true
				})
				.then(result => {
					if (!resolved) {
						resolved = true
						resolve(result)
					}
				})
			fetchInCache(request)
				.then(result => {
					if (resolved)
						return
					if (result) {
						resolved = true
						resolve(result)
					} else {
						if (otherFailed)
							reject()
						else
							otherFailed = true
					}
				})
		})
}

function processBacklog() {
	if (workerState.isListening)
		return
	workerState.isListening = true
	navigator.serviceWorker.addEventListener('message', onMessage, { once: true })
	navigator.serviceWorker.controller.postMessage({ idleRequest: true })
}

function onMessage({ data }) {
	requestIdleCallback(() => {
		workerState.isListening = false
		if (data.idle && data.availableConnections > 0)
			manyRequests(data.availableConnections)
		else
			processBacklog()
	})
}

function manyRequests(number) {
	for (let count = number; count > 0; count--) {
		if (!makeRequest())
			break
	}
}

function makeRequest() {
	requestIdleCallback(() => {
		if (!workerState.backlog.length)
			return false
		const { request, callback, resolve, reject } = workerState.backlog.shift()
		if (typeof callback === 'function')
			fetch(request)
				.catch(() => workerState.backlog.unshift({ request, callback, resolve, reject }))
				.then(callback)
				.finally(processBacklog)
		else
			fetch(request)
				.catch(reject)
				.then(resolve)
				.finally(processBacklog)
		return true
	})
}

function cancelIdleNetwork(id) {
	const index = workerState.backlog.findIndex(item => item.id === id)
	if (index === -1)
		return false
	workerState.backlog.splice(index, 1)
	return true
}

function requestIdleNetwork(request, callback) {
	if (!workerState.ServiceWorkerState.isReady) {
		const requestId = ++workerState.id
		fetchInCache(request).finally(result => {
			if (result)
				callback(result)
			else {
				workerState.backlog.push({ id: requestId, request, callback })
				if (workerState.ServiceWorkerState.isReady)
					processBacklog()
			}
		})
		return requestId
	} else {
		workerState.backlog.push({ id: ++workerState.id, request, callback })
		processBacklog()
		return workerState.id
	}
}

function idleFetch(request) {
	return new Promise(async (resolve, reject) => {
		if (!workerState.ServiceWorkerState.isReady) {
			const result = await fetchInCache(request)
			if (result)
				resolve(result)
			else {
				workerState.backlog.push({ request, resolve, reject })
				if (workerState.ServiceWorkerState.isReady)
					processBacklog()
			}
		} else {
			workerState.backlog.push({ request, resolve, reject })
			processBacklog()
		}
	})
}

async function onmessage ({ data: { id, fn, args, port } }) {
	if(port) {
		workerState.port = port
	} else {
		const response = await self[fn].call(self, ...args)
		postMessage({ response, id })
	}
}
