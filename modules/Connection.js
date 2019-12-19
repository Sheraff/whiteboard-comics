export default class Connection {
	// TODO: use this to re-fetch graphs that were requested when offline and failed
	constructor() {
		if (!!Connection.instance) {
			return Connection.instance;
		}
		Connection.instance = this
		this.connectionChange()
		navigator.connection.addEventListener('change', this.connectionChange)
	}

	get online() {
		return this.onlinePromise
	}

	get isOnline() {
		return this.onlineStatus
	}

	connectionChange() {
		const online = navigator.connection.downlink > 0
		if (online !== this.onlineStatus) {
			this.onlineStatus = online
			if (this.onlineStatus && this.onlineResolve)
				this.onlineResolve()
			if (!this.onlineStatus || !this.onlinePromise)
				this.onlinePromise = new Promise(resolve => this.onlineResolve = resolve)
		}
	}
}