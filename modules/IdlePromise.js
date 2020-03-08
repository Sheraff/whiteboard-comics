export default class IdlePromise {
	static duration = Symbol('Next yield duration')
	static onUrgent = Symbol('Callbacks when finish()')
	static onCancel = Symbol('Callbacks when cancel()')
	static padding = 10

	promise = new Promise((resolve, reject) => {
		this.resolve = resolve
		this.reject = reject
	})
	then = this.promise.then.bind(this.promise)
	catch = this.promise.catch.bind(this.promise)
	finally = this.promise.finally.bind(this.promise)

	constructor(generator) {
		this.urgent = false
		this[IdlePromise.duration] = 0
		this[IdlePromise.onUrgent] = []
		this.iterator = generator(this.resolve, this.reject)
		this.then(() => {
			delete this[IdlePromise.onUrgent]
			delete this.iterator
		})
		
		this.finish = this.finish.bind(this)
		this.addUrgentListener = this.addUrgentListener.bind(this)

		this.run()
	}

	async step() {
		const { value, done } = await this.iterator.next(this.urgent)
		this.done = done
		if (!done) this[IdlePromise.duration] = value || IdlePromise.padding
	}

	run() {
		this.idleCallbackId = requestIdleCallback(async idleDeadline => {
			while (!this.done && this[IdlePromise.duration] < idleDeadline.timeRemaining())
				await this.step()
			if (!this.done) this.run()
		})
	}

	addUrgentListener(callback) {
		if (this.urgent) callback()
		else this[IdlePromise.onUrgent].push(callback)
	}

	async finish() {
		this.urgent = true
		if (this.idleCallbackId) cancelIdleCallback(this.idleCallbackId)
		if (this[IdlePromise.onUrgent]) this[IdlePromise.onUrgent].forEach(callback => callback())
		while (!this.done) await this.step()
		return this.promise
	}

	addCancelListener(callback) {
		if(this.canceled) callback()
		if(!this[IdlePromise.onCancel]) this[IdlePromise.onCancel] = []
		this[IdlePromise.onCancel].push(callback)
	}

	cancel() {
		this.canceled = true
		if (this.idleCallbackId) cancelIdleCallback(this.idleCallbackId)
		if (this[IdlePromise.onCancel]) this[IdlePromise.onCancel].forEach(callback => callback())
		this.reject()
		return this.promise
	}
}