/*
 * 
 * create a queue of (small) tasks and subtasks
 * - these function will run in requestIdleCallback automatically
 * - they run sequentially, each receiving the results from the previous one
 * - at any point during execution you can ask to finish ASAP
 * - instead of providing a function, you can provide an array of functions, the next task will receive an array of results
 * 
 * There are only 4 methods you should use
 * - new IdleStack() to create a queue, takes a function as an argument
 * - .then() to add a task at the end of the queue
 * - .next() to add a task after the first task (and after any other task added with .next())
 * - .finish() takes over from requestIdleCallback and runs every task synchronously, returns a promise
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
 */

export default class IdleStack {
	static PADDING = 5

	constructor(resolve) {
		this.currentTask = { task: resolve }
		this.lastTask = this.currentTask
		this.start()
		return this
	}

	// insert after current task (and after all tasks already marked as 'next')
	next(resolve, currentTask = this.currentTask) {
		const insertBefore = currentTask.nextTask
		if(insertBefore && insertBefore.next)
			return this.next(resolve, insertBefore)
		currentTask.nextTask = { task: resolve, next: true }
		if(!insertBefore)
			this.lastTask = currentTask.nextTask
		else
			currentTask.nextTask.nextTask = insertBefore
		return this
	}

	// insert after all tasks
	then(resolve) {
		this.lastTask.nextTask = { task: resolve }
		this.lastTask = this.lastTask.nextTask
		return this
	}

	start() {
		this.idleCallbackId = requestIdleCallback(async idleDeadline => {
			this.isExecuting = true
			while (idleDeadline.timeRemaining() > (this.currentTask.time || IdleStack.PADDING)) {
				await this.executeTask(this.currentTask)
				if(!this.currentTask.nextTask)
					break
				this.currentTask.nextTask.previousResult = this.currentTask.result
				this.currentTask = this.currentTask.nextTask
			}
			this.isExecuting = false
			if(this.endOfTaskPromise)
				this.endOfTaskPromise()
			else if(this.currentTask.nextTask)
				this.start()
			else
				delete this.idleCallbackId
		})
	}

	async finish() {
		this.isFinishing = true

		if(this.idleCallbackId) {
			cancelIdleCallback(this.idleCallbackId)
			delete this.idleCallbackId
		}

		const waitToFinish = this.isExecuting
			? new Promise(resolve => this.endOfTaskPromise = resolve)
			: Promise.resolve()

		return new Promise(async resolve => {
			await waitToFinish
			while (this.currentTask) {
				await this.executeTask(this.currentTask)
				if(!this.currentTask.nextTask)
					break
				this.currentTask.nextTask.previousResult = this.currentTask.result
				this.currentTask = this.currentTask.nextTask
			}
			resolve(this.lastTask.result)
		})
	}

	async executeTask(object) {
		if(Array.isArray(object.task)) {
			object.result = await Promise.all(object.task.map(async fn => await fn(object.previousResult, this)))
		} else {
			object.result = await object.task(object.previousResult, this)
		}
	}
}