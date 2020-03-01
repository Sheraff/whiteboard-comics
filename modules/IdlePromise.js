export default class IdlePromise {
	static duration = Symbol('Next yield duration')
	static onFinish = Symbol('Callbacks when finish()')
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
		this[IdlePromise.onFinish] = []
		this.iterator = generator(this.resolve, this.reject)
		this.run()
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

	
	set onFinish(callback) {
		this[IdlePromise.onFinish].push(callback)
	}

	async finish() {
		this.synchronous = true
		if (this.idleCallbackId) cancelIdleCallback(this.idleCallbackId)
		this[IdlePromise.onFinish].forEach(callback => callback())
		while (!this.done) await this.step()
		return this.promise
	}
}