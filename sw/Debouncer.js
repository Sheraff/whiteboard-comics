class Debouncer {

	static DEBOUNCE_TIME = 50
	static MAX_CONCURRENT_SAME_ORIGIN_REQUESTS = 6

	constructor() {
		this.debounceTimeoutId
		this.debounceCallback = () => { }
		this.currentConnections = 0
		this.activeTimeout = false
	}

	// add 'removeEventListener' for port too
	listenToMessages(port) {
		port.addEventListener('message', message => {
			if (!message.data.idleRequest)
				return
			this.debounceCallback = () => message.source.postMessage({ 
				idle: true,
				availableConnections: Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS - this.currentConnections
			})
			if (!this.debounceTimeoutId)
				this.requestSlot()
		})
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