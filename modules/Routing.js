import makeSingleton from '../functions/makeSingleton.js'

export default makeSingleton(class Router {

	constructor(initialState) {
		history.replaceState(initialState, initialState, location.pathname)
		addEventListener('popstate', this.popStateListener.bind(this))
		this.listeners = new Set()
	}
	
	popStateListener(event) {
		console.log(event)
		this.listeners.forEach(callback => callback(event.state))
	}

	push(name) {
		history.pushState(name, name, name ? `/${name}` : '/')
		this.changeTitle(name)
	}

	addChangeListener(callback) {
		this.listeners.add(callback)
	}

	changeTitle(name) {
		if(!name)
			document.title = 'Whiteboard Comics'
		else
			document.title = `Whiteboard Comics — ${this.cleanTitle(name)}`
	}

	cleanTitle(name) {
		return name
			.replace(/_/gi, ' ')
			.replace(/,/gi, ', ')
			.replace(/([a-z()])(?!$)([^a-z()\s,])/gi, '$1 $2 ')
	}
})