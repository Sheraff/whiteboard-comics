export default class ServiceWorkerState {

	constructor() {
		if (!!ServiceWorkerState.instance)
			return ServiceWorkerState.instance;
		ServiceWorkerState.instance = this
		this.calls = {}
		this.worker = new Worker('../workers/serviceWorkerStateWorker.js')
		this.worker.addEventListener('message', this.onMessage.bind(this))
		this.id = 0
	}

	onMessage({ data: { id, response } }) {
		const resolve = this.calls[id]
		if (resolve) {
			delete this.calls[key]
			resolve(response)
		}
	}

	async isReady() {
		const id = ++this.id
		const promise = new Promise(resolve => this.calls[id] = resolve)
		this.worker.postMessage({ id, query: 'isReady' })
		return promise
	}

	async then() {
		const id = ++this.id
		const promise = new Promise(resolve => this.calls[id] = resolve)
		this.worker.postMessage({ id, query: 'then' })
		return promise
	}

	connect(port) {
		if(port)
			return this.worker.postMessage({ port }, [port])
		const {port1, port2} = new MessageChannel()
		this.worker.postMessage({ port: port1 }, [port1])
		return port2
	}
}