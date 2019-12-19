const workerState = {
	isWorkerReady: false
}
workerState.readyPromise = new Promise(resolve => workerState.readyResolve = resolve)

if (navigator.serviceWorker) {
	workerState.isWorkerReady = navigator.serviceWorker
		&& navigator.serviceWorker.controller
		&& navigator.serviceWorker.controller.state === 'activated'

	if (!workerState.isWorkerReady) {
		navigator.serviceWorker.addEventListener('message', () => {
			workerState.isWorkerReady = true
			workerState.readyResolve()
		}, { once: true })
	} else {
		workerState.readyResolve()
	}
}

function isReady() {
	return workerState.isWorkerReady
}

async function then() {
	await workerState.readyPromise
	return
}

function getOnMessage(channelPort = self) {
	return async ({ data: { id, query, port } }) => {
		if(port) {
			port.onmessage = getOnMessage(port)
		} else {
			const response = await self[query]()
			channelPort.postMessage({ response, id })
		}
	}
}

self.onmessage = getOnMessage()