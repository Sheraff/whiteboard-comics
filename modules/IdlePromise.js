export default class IdlePromise {
	static duration = Symbol('Next yield duration')
	static onUrgent = Symbol('Callbacks when finish()')
	static padding = 1

	promise = new Promise((resolve, reject) => {
		this.resolve = resolve
		this.reject = reject
	})
	then = this.promise.then.bind(this.promise)
	catch = this.promise.catch.bind(this.promise)
	finally = this.promise.finally.bind(this.promise)

	constructor(generator) {
		this.synchronous = false
		this[IdlePromise.duration] = 0
		this[IdlePromise.onUrgent] = []
		this.iterator = generator(this.resolve, this.reject)
		this.run()
		this.then(() => {
			delete this[IdlePromise.onUrgent]
			delete this.iterator
		})
	}

	async step() {
		const { value, done } = await this.iterator.next(this.synchronous)
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


	set onUrgent(callback) {
		if (this.synchronous) callback()
		else this[IdlePromise.onUrgent].push(callback)
	}

	async finish() {
		this.synchronous = true
		if (this.idleCallbackId) cancelIdleCallback(this.idleCallbackId)
		if (this[IdlePromise.onUrgent]) this[IdlePromise.onUrgent].forEach(callback => callback())
		while (!this.done) await this.step()
		return this.promise
	}
}