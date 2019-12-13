class Debouncer {

	static DEBOUNCE_TIME = 50
	static MAX_CONCURRENT_SAME_ORIGIN_REQUESTS = 6

	constructor(serviceWorker) {
		this.debounceTimeoutId
		this.debounceCallback = () => { }
		this.currentConnections = 0
		this.activeTimeout = false

		serviceWorker.addEventListener('message', message => {
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
		this.currentConnections = Math.min(this.currentConnections + 1, Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS)
		if (this.debounceTimeoutId && this.currentConnections >= Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS) {
			this.activeTimeout = false
			clearTimeout(this.debounceTimeoutId)
		}
	}

	endFetching() {
		this.currentConnections = Math.max(this.currentConnections - 1, 0)
		if (!this.debounceTimeoutId && this.currentConnections < Debouncer.MAX_CONCURRENT_SAME_ORIGIN_REQUESTS)
			this.requestSlot()
	}
}