export default class ServiceWorkerState {

    promise = new Promise(resolve => this.resolve = resolve)
    then = this.promise.then.bind(this.promise)
    broadcast = new BroadcastChannel('SW_Channel')

    constructor() {
        this.initBroadcast()
    }
    
    initBroadcast() {
        this.broadcast.addEventListener('message', ({data}) => {
            if(data.active) this.resolve()
        })
        this.broadcast.postMessage('')
    }

    connect() {
        const {port1, port2} = new MessageChannel()
        this.broadcast.postMessage.postMessage({ port: port1 }, [port1])
		return port2
	}
}