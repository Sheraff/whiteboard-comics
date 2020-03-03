import ServiceWorkerState from './ServiceWorkerState.js'

export default class IdleNetwork {
	constructor() {
		if (!!IdleNetwork.instance)
			return IdleNetwork.instance
		IdleNetwork.instance = this

		this.calls = {}
		this.worker = new Worker('../workers/idleNetworkWorker.js')
		this.worker.addEventListener('message', this.onMessage.bind(this))
		this.id = 0

		this.ServiceWorkerState = new ServiceWorkerState()
		const port = this.ServiceWorkerState.connect('IdleNetwork', 'debouncer')
		this.worker.postMessage({ port }, [port])
	}

	onMessage({ data: { id, response } }) {
		const resolve = this.calls[id]
		if (resolve) {
			delete this.calls[id]
			resolve(response)
		}
	}

	callFunction(query, args) {
		const id = ++this.id
		const promise = new Promise(resolve => this.calls[id] = resolve)
		this.worker.postMessage({ id, query, args })
		return promise
	}

	async race() {
		return this.callFunction('race', Array.from(arguments))
	}

	async idleFetch() {
		return this.callFunction('idleFetch', Array.from(arguments))
	}

	async cancelIdleNetwork(id) {
		if(!this.calls[id])
			return
		const requestId = this.calls[id].requestId
		delete this.calls[id]
		return this.callFunction('cancelIdleNetwork', [requestId])
	}

	requestIdleNetwork(request, callback) {
		const id = ++this.id
		this.calls[id] = (requestId) => {
			this.calls[id] = callback
			this.calls[id].requestId = requestId
			this.worker.postMessage({ id, query: 'resolveRequest', args: [requestId] })
		}
		this.worker.postMessage({ id, query: 'requestIdleNetwork', args: [request] })
		return id
	}
	
}