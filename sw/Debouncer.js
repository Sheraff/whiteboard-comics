class Debouncer {

	static DEBOUNCE_TIME = 50
	static MAX_CONCURRENT_SAME_ORIGIN_REQUESTS = 6

	constructor() {
		this.debounceTimeoutId
		this.debounceCallback = () => { }
		this.currentConnections = 0
		this.activeTimeout = false
		this.portsMap = new Map()
		this.onMessage = this.onMessage.bind(this)
	}

	listenToMessages(port, id) {
		if(this.portsMap.has(id)) {
			const oldPort = this.portsMap.get(id)
			delete oldPort.onmessage
		}
		this.portsMap.set(id, port)
		port.onmessage = (message) => this.onMessage(message, port)
		port.postMessage('')
	}

	onMessage(message, port) {
		if (!message.data.idleRequest)
			return
		this.debounceCallback = () => port.postMessage({ 
			idle: true,
			availableConnections: Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS - this.currentConnections
		})
		if (!this.debounceTimeoutId)
			this.requestSlot()
	}

	timedOut() {
		this.activeTimeout = false
		this.debounceTimeoutId = undefined
		this.debounceCallback()
	}

	requestSlot() {
		if(!this.activeTimeout) {
			this.activeTimeout = true
			this.debounceTimeoutId = setTimeout(this.timedOut.bind(this), Debouncer.DEBOUNCE_TIME)
		}
	}

	startFetching() {
		this.currentConnections++
		this.currentConnections = Math.min(this.currentConnections, Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS)
		if (this.debounceTimeoutId && this.currentConnections >= Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS) {
			this.activeTimeout = false
			clearTimeout(this.debounceTimeoutId)
		}
	}

	endFetching() {
		this.currentConnections--
		this.currentConnections = Math.max(this.currentConnections, 0)
		if (!this.debounceTimeoutId && this.currentConnections < Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS)
			this.requestSlot()
	}
}