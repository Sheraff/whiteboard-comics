export class IdlePromise {
    constructor(steps, {deadline = 15, init}) {
        this.steps = steps
        this.MIN_DEADLINE = deadline // how long will each operation (item in steps[]) need (in milliseconds)
        this._state = init

        this._yieldPromise = []
        this.request()
    }

    // request idle callback and keep ID & deadline
    request() {
        this.requestId = requestIdleCallback(idleDeadline => {
            this.requestId = null
            this.continue(idleDeadline)
        })
    }

    // idleCallback was granted, now what do we do
    continue(idleDeadline) {
        if (!this.steps.length)
            this.resolve()

        else if (this.immediately)
            this.step()

        else if (idleDeadline && idleDeadline.timeRemaining() > this.MIN_DEADLINE)
            this.step(idleDeadline)
        
        else
            this.request()
    }

    // store result and call each .then() & .yield() callbacks
    resolve() {
        this._value = this._state
        if (this._yieldPromise.length)
            this._yieldPromise.forEach(yieldPromise => yieldPromise(this._value))
    }

    // depile one from Array given to constructor
    async step(idleDeadline) {
        this._state = await this.steps.shift()(this._state)
        this.continue(idleDeadline)
    }

    // return when lazy path is done
    then(callback) {
        if (this._value !== undefined)
            return Promise.resolve(this._value).then(callback)
        else
            return new Promise(resolve => {
                this._yieldPromise.push(resolve)
                if(this.requestId) {
                    cancelIdleCallback(this.requestId)
                    this.continue()
                }
            }).then(callback)
    }

    // return ASAP
    yield(callback) {
        this.immediately = true
        return this.then(callback)
    }

    // cancel everything and just set a value
    set value(value) {
        this._value = value
        cancelIdleCallback(this.requestId)
    }
}

// // sample declaration
// const a = new IdlePromise([
//     (res) => res,
//     (res) => res * 100,
//     async (res) => await new Promise(resolve => setTimeout(() => resolve(res * 3), 1000)),
//     async (res) => await Promise.all([
//         new Promise(resolve => resolve(res)),
//         new Promise(resolve => resolve(res * 2))
//     ]),
//     (res) => res[0] + res[1]
// ], {init: 5, deadline: 10})


// // sample promise use
// a.then(res => console.log('promise:', res))

// // sample await use
// const res = await a.yield()
