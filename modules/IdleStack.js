/*
 * 
 * create a queue of (small) tasks and subtasks
 * - these function will run in requestIdleCallback automatically
 * - they run sequentially, each receiving the results from the previous one
 * - at any point during execution you can ask to finish ASAP
 * - instead of providing a function, you can provide an array of functions, the next task will receive an array of results
 * - you can provide a second argument (after your function / array of functions) to tell IdleStack how much time your task needs (in milliseconds)
 * 
 * There are the methods you should use:
 * - new IdleStack() to create a queue, takes a function as an argument
 * - .then() to add a task at the end of the queue
 * - .next() to add a task after the first task (and after any other task added with .next())
 * - .finish() takes over from requestIdleCallback and runs every task synchronously, returns a promise
 * - .promise returns a promise that resolves when the queue is completed
 * 
 * 
 * 
 * Example of how to create a queue

const stack = new IdleStack(() => task1())
	.then((result1, stack) => {
		const subtask = result1.map(task2)
		stack.next(subtask)
	})
	.then((result2, stack) => {
		stack.next(() => task3(result2))
		stack.next(result3 => task4(result3))
	})
	
 * 
 * 
 * 
 * Example of how to use a queue

const stack = createIdleStack()

const simulateDelay = new Promise(resolve => setTimeout(
	() => resolve(stack.finish())
, 500))

Promise.race([
	stack,
	simulateDelay,
]).then(result => {
	console.log(result)
})

 * 
 * 
 * 
 * Example of how to switch the task method before .finish()

const fetchSerializedXML = (charsArray, stack) => {
	const idleNetwork = new IdleNetwork()
	return async (_, onFinish) => await Promise.all(charsArray.map(async char => {
		let response
		const charURL = `/alphabet/alphabet_${char}.svg`
		if (stack.isFinishing) {
			response = await fetch(charURL)
		} else {
			let idleRequestId
			response = await Promise.race([
				new Promise(resolve => {
					idleRequestId = idleNetwork.requestIdleNetwork(charURL, resolve)
				}),
				new Promise(resolve => onFinish(async () => {
					const cancelable = idleNetwork.cancelIdleNetwork(idleRequestId)
					if (cancelable)
						resolve(await fetch(charURL))
				}))
			])
		}
		const serializedXML = await response.text()
		return { char, serializedXML }
	}))
}

 * 
 * 
 */

export default class IdleStack {
	static PADDING = 5

	constructor(resolve, time) {

		// create queue
		this.currentTask = { task: resolve, time }
		this.lastTask = this.currentTask
		this.start()

		// allows for `stack.promise.then()` to trigger once the whole stack has been completed
		this.completedStackPromise = new Promise(resolve => {
			this.stackIsPending = true
			this.completedStackTrigger = resolve
		}).then(() => {
			this.stackIsPending = false
			return this.lastTask.result
		})
	}

	// insert after current task (and after all tasks already marked as 'next')
	next(resolve, time, currentTask = this.currentTask) {
		const insertBefore = currentTask.nextTask
		if (insertBefore && insertBefore.next)
			return this.next(resolve, time, insertBefore)
		const isArray = Array.isArray(resolve)
		currentTask.nextTask = { task: resolve, next: true, time, isArray }
		if (!insertBefore)
			this.lastTask = currentTask.nextTask
		else
			currentTask.nextTask.nextTask = insertBefore
		return this
	}

	// insert after all tasks
	then(resolve, time) {
		const isArray = Array.isArray(resolve)
		this.lastTask.nextTask = { task: resolve, time, isArray }
		this.lastTask = this.lastTask.nextTask
		return this
	}

	shouldKeepProcessing() {
		if(!this.currentTask || !this.currentTask.task)
			return false
		if(this.currentTask.isArray && this.currentTask.task.length)
			return true
		if(!this.currentTask.isArray)
			return true
		return false
	}

	start() {
		this.idleCallbackId = requestIdleCallback(async idleDeadline => {
			this.isExecuting = true
			await this.processSomeTasks(() => idleDeadline.timeRemaining() > (this.currentTask.time || IdleStack.PADDING))
			this.isExecuting = false
			if (this.endOfTaskPromise)
				this.endOfTaskPromise()
			else if (this.shouldKeepProcessing())
				this.start()
			else
				delete this.idleCallbackId
		})
	}

	async finish() {
		this.isFinishing = true

		if (this.idleCallbackId) {
			cancelIdleCallback(this.idleCallbackId)
			delete this.idleCallbackId
		}

		if(this.stackIsPending && this.isExecuting && this.currentTask.onFinish.length)
			this.currentTask.onFinish.forEach(callback => callback(this))

		const waitToFinish = this.isExecuting
			? new Promise(resolve => this.endOfTaskPromise = resolve)
			: Promise.resolve()

		return new Promise(async resolve => {
			await waitToFinish
			await this.processSomeTasks(() => !!this.currentTask)
			resolve(this.lastTask.result)
		})
	}

	getOnFinish(currentTask) {
		if(!currentTask.onFinish)
			currentTask.onFinish = []
		return (callback) => {
			currentTask.onFinish.push(callback)
		}
	}

	async processSomeTasks(getFlag) {
		while (getFlag()) {
			if (this.currentTask.isArray && this.currentTask.task.length) {
				if(this.isFinishing) {
					await Promise.all(this.currentTask.task.map(async task => await this.executeTask(task, this.currentTask, true)))
				} else {
					await this.executeTask(this.currentTask.task.shift(), this.currentTask, true)
					if (this.currentTask.task.length)
						continue
				}
			} else if (!this.currentTask.isArray) {
				await this.executeTask(this.currentTask.task, this.currentTask)
			}
			if (!this.currentTask.nextTask) {
				delete this.currentTask
				this.completedStackTrigger()
				break
			}
			this.currentTask.nextTask.previousResult = this.currentTask.result
			this.currentTask = this.currentTask.nextTask
		}
	}

	async executeTask(task, object, push) {
		const result = await task(object.previousResult, this.getOnFinish(object))
		if (push) {
			if (!object.result)
				object.result = []
			object.result.push(result)
		}
		else
			object.result = result
	}

	get promise() {
		return this.completedStackPromise
	}
}