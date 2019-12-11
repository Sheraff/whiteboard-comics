class Debouncer {

	static DEBOUNCE_TIME = 100

	constructor(serviceWorker) {
		this.debounceTimeoutId
		this.debounceCallback = () => { }

		serviceWorker.addEventListener('message', message => {
			if (!message.data.idleRequest)
				return
			this.debounceCallback = () => message.source.postMessage({ idle: true })
			if (!this.debounceTimeoutId)
				this.init()
		})
	}

	timedOut() {
		this.debounceTimeoutId = undefined
		this.debounceCallback()
	}

	init() {
		this.debounceTimeoutId = setTimeout(this.timedOut.bind(this), Debouncer.DEBOUNCE_TIME)
	}

	pause() {
		if (this.debounceTimeoutId)
			clearTimeout(this.debounceTimeoutId)
	}

	start() {
		if (this.debounceTimeoutId)
			this.init()
	}
}