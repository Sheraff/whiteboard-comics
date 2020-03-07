const CACHE_NAME = 'whiteboard-files-cache-v0'

const workerState = {
	backlog: [],
	isListening: false,
	id: 0,
	swIsReady: false
}

function waitOnServiceWorker(port) {
	console.log('SW idle worker waiting for', port)
	workerState.swPort = port
	port.onmessage = () => {
		console.log('SW idle worker received message on port', port)
		workerState.swIsReady = true
		workerState.isListening = false
		delete port.onmessage
		processBacklog()
	}
}

async function fetchInCache(request) {
	if (!self.caches)
		return Promise.reject()
	if (!workerState.cache)
		workerState.cache = await caches.open(CACHE_NAME)
	const result = await workerState.cache.match(request)
	if (result) return result
	throw new Error(`Not in cache: ${request}`)
}

function race(request) {
	if (workerState.swIsReady || !self.caches)
		return fetch(request)
	else
		return new Promise((resolve, reject) => {
			const { signal, abort } = new AbortController()
			const networkPromise = fetch(request, { signal }).then(resolve)
			const cachePromise = fetchInCache(request).then(result => {
				resolve(result)
				abort()
			})
			Promise.allSettled([networkPromise, cachePromise]).then(reject)
		})
}

function processBacklog() {
	if (workerState.isListening)
		return
	workerState.isListening = true
	workerState.swPort.onmessage = onServiceWorkerMessage
	workerState.swPort.postMessage({ idleRequest: true })
}

function onServiceWorkerMessage({ data }) {
	delete workerState.swPort.onmessage
	workerState.isListening = false
	if (data.idle && data.availableConnections > 0)
		manyRequests(data.availableConnections)
	else
		processBacklog()
}

function manyRequests(number) {
	for (let count = number; count > 0; count--) {
		if (!makeRequest())
			break
	}
}

function makeRequest() {
	if (!workerState.backlog.length)
		return false
	const index = workerState.backlog.findIndex(({ callback, resolve }) => callback || resolve)
	if (index === -1)
		return false
	const { request, callback, resolve, reject } = workerState.backlog.splice(index, 1)[0]
	if (callback instanceof Function)
		fetch(request)
			.then(callback)
			.catch(() => workerState.backlog.unshift({ request, callback, resolve, reject }))
			.finally(processBacklog)
	else
		fetch(request)
			.then(resolve)
			.catch(reject)
			.finally(processBacklog)
	return true
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
	return new Promise(async resolve => {
		if (workerState.swIsReady) {
			Object.assign(backlogEntry, { callback: resolve })
			processBacklog()
		} else try {
			const result = await fetchInCache(backlogEntry.request)
			workerState.backlog.splice(backlogEntryIndex, 1)
			resolve(result)
		} catch {
			Object.assign(backlogEntry, { callback: resolve })
			if (workerState.swIsReady)
				processBacklog()
		}
	})
}

function idleFetch(request) {
	return new Promise(async (resolve, reject) => {
		if (workerState.swIsReady) {
			workerState.backlog.push({ request, resolve, reject })
			processBacklog()
		} else try {
			const result = await fetchInCache(request)
			resolve(result)
		} catch {
			workerState.backlog.push({ request, resolve, reject })
			if (workerState.swIsReady)
				processBacklog()
		}
	})
}

async function parseResponse(response, streamType) {
	if (typeof response !== 'object')
		return response
	switch (streamType) {
		case 'json':
			return await response.json()
		default:
			return await response.text()
	}
}

async function onWindowMessage({ data: { id, query, args, port } }) {
	if (port) {
		waitOnServiceWorker(port)
	} else {
		const response = await self[query].call(self, ...args)
		if (!response)
			postMessage({ id })

		const text = await parseResponse(response, args[1] && args[1].streamType)
		postMessage({ response: text, id })
	}
}

self.onmessage = onWindowMessage
