// calls to serviceWorkerState should be postMessages to workerState.port given by:
// [port1, port2] = new MessageChannel()
// worker1.postMessage({port: port1}, [port1])
// worker2.postMessage({port: port2}, [port2])

const workerState = {
	backlog: [],
	isListening: false,
	id: 0,
	swIsReady: false
}

function initBroadcast() {
	const broadcast = new BroadcastChannel('SW_Channel')
	broadcast.addEventListener('message', (event) => {
		console.log(event)
		const {data} = event
		if(data.port) {
			workerState.swIsReady = true
			workerState.isListening = false
			workerState.swPort = data.port
			processBacklog()
		}
	})
	broadcast.postMessage('')
}

function fetchInCache(request) {
	if (!self.caches)
		return Promise.reject()
	return caches.match(request)
}

function race(request) {
	if (workerState.swIsReady || !self.caches)
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
	workerState.swPort.addEventListener('message', onServiceWorkerMessage, { once: true })
	workerState.swPort.postMessage({ idleRequest: true })
}

function onServiceWorkerMessage({ data }) {
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
		const index = workerState.backlog.findIndex(({ callback, resolve }) => callback || resolve)
		if (index === -1)
			return false
		const { request, callback, resolve, reject } = workerState.backlog.splice(index, 1)[0]
		if (callback instanceof Function)
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

function requestIdleNetwork(request) {
	const id = ++workerState.id
	workerState.backlog.push({ id, request })
	return id
}

function resolveRequest(requestId) {
	const backlogEntryIndex = workerState.backlog.findIndex(({ id }) => id === requestId)
	const backlogEntry = workerState.backlog[backlogEntryIndex]
	return new Promise(resolve => {
		if (!workerState.swIsReady) {
			return fetchInCache(backlogEntry.request).finally(result => {
				if (result) {
					workerState.backlog.splice(backlogEntryIndex, 1)
					resolve(result)
				} else {
					Object.assign(backlogEntry, { callback: resolve })
					if (workerState.swIsReady)
						processBacklog()
				}
			})
		} else {
			Object.assign(backlogEntry, { callback: resolve })
			processBacklog()
		}
	})
}

function idleFetch(request) {
	return new Promise(async (resolve, reject) => {
		if (!workerState.swIsReady) {
			const result = await fetchInCache(request)
			if (result)
				resolve(result)
			else {
				workerState.backlog.push({ request, resolve, reject })
				if (workerState.swIsReady)
					processBacklog()
			}
		} else {
			workerState.backlog.push({ request, resolve, reject })
			processBacklog()
		}
	})
}

async function parseResponse(response, streamType) {
	if(typeof response !== 'object')
		return response
	switch(streamType) {
		case 'json':
			return await response.json()
		default:
			return await response.text()
	}
}

async function onWindowMessage({ data: { id, query, args, port } }) {
	if (port) {
		// waitOnServiceWorker(port)
	} else {
		const response = await self[query].call(self, ...args)
		if(!response)
			postMessage({ id })

		const text = await parseResponse(response, args[1] && args[1].streamType)
		postMessage({ response: text, id })
	}
}

self.onmessage = onWindowMessage
initBroadcast()
