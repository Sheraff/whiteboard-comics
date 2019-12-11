let isWorkerReady = navigator.serviceWorker
	&& navigator.serviceWorker.controller
	&& navigator.serviceWorker.controller.state === 'activated'
const backlog = []
let isListening = false
let id = 0


if (!isWorkerReady) {
	navigator.serviceWorker.addEventListener('message', () => {
		isWorkerReady = true
		processBacklog()
	}, { once: true })
} else (
	processBacklog()
)

async function findInCache(request) {
	return await caches.match(request)
}

function processBacklog() {
	if (isListening)
		return

	isListening = true
	navigator.serviceWorker.addEventListener('message', ({ data }) => {
		isListening = false
		if (data.idle)
			makeRequest()
		else
			processBacklog()
	}, { once: true })
	navigator.serviceWorker.controller.postMessage({ idleRequest: true })
}

function makeRequest() {
	if (!backlog.length)
		return
	const { request, callback, resolve, reject } = backlog.shift()
	if (typeof callback === 'function')
		fetch(request).then(callback).finally(processBacklog)
	else
		fetch(request).catch(reject).then(resolve).finally(processBacklog)

}

export function cancelIdleNetwork(id) {
	const index = backlog.findIndex(item => item.id === id)
	if (index === -1)
		return false
	backlog.splice(index, 1)
	return true
}

export function requestIdleNetwork(request, callback) {
	if (!isWorkerReady) {
		const requestId = ++id
		findInCache(request).then(result => {
			if (result)
				callback(result)
			else {
				backlog.push({ id: requestId, request, callback })
				if (isWorkerReady)
					processBacklog()
			}
		})
		return requestId
	} else {
		backlog.push({ id: ++id, request, callback })
		if (isWorkerReady)
			processBacklog()
		return id
	}
}

export function idleFetch(request) {
	return new Promise(async (resolve, reject) => {
		if (!isWorkerReady) {
			const result = await findInCache(request)
			if (result)
				resolve(result)
			else {
				backlog.push({ request, resolve, reject })
				if (isWorkerReady)
					processBacklog()
			}
		} else {
			backlog.push({ request, resolve, reject })
			if (isWorkerReady)
				processBacklog()
		}
	})
}