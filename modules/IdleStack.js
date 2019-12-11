export default class IdleStack {

	static PADDING = 5

	constructor() {
		this.stack = []
		this.id = 0
		this.finishing = false
	}

	then(resolve) {
		this.resolve = resolve
		if(!this.stack.length)
			this.callback()
	}

	callback() {
		if(this.resolve) {
			this.resolve(this.lastResult)
			this.resolve = undefined
		}
	}

	push(task) {
		this.stack.push({task, id: ++this.id})
		if(!this.idleCallbackId)
			this.start()
		return this.id
	}

	cancel(taskId) {
		const index = this.stack.findIndex(({id}) => id === taskId)
		if(index === -1)
			return false
		this.stack.splice(index, 1)
		return true
	}

	start() {
		this.idleCallbackId = requestIdleCallback(async idleDeadline => {
			while (this.stack.length && idleDeadline.timeRemaining() > IdleStack.PADDING) {
				const { task } = this.stack.shift()
				this.lastResult = await task(this.lastResult)
			}
			if(this.stack.length)
				this.start()
			else
				this.callback()
		})
	}

	async runUpTo(taskId) {
		if(this.finishing)
			throw new Error('IdleStack: already finishing')
		if(this.stack.find(({id}) => id === taskId))
			throw new Error('IdleStack: task not found')

		if(this.idleCallbackId)
			cancelIdleCallback(this.idleCallbackId)

		let reached = false
		while (this.stack.length && !reached) {
			const { task, id } = this.stack.shift()
			reached = id === taskId
			this.lastResult = await task(this.lastResult)
		}
		if(this.stack.length)
			this.start()
		else
			this.callback()
		return this.lastResult
	}

	async finish() {
		this.finishing = true
		if(this.idleCallbackId)
			cancelIdleCallback(this.idleCallbackId)
		while (this.stack.length) {
			const { task } = this.stack.shift()
			this.lastResult = await task(this.lastResult)
		}
		this.callback()
		return this.lastResult
	}
}