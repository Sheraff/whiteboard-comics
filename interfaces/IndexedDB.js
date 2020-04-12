import makeSingleton from '../functions/makeSingleton.js'

export default makeSingleton(class IndexedDBManager {

	constructor() {
		this.calls = {}
		this.worker = new Worker('../workers/indexedDBWorker.js')
		this.worker.addEventListener('message', this.onMessage.bind(this))
	}

	onMessage({ data }) {
		const key = `${data.table}_${data.key}`
		const resolve = this.calls[key]
		if (resolve) {
			delete this.calls[key]
			resolve(data.result)
		}
	}

	getGraph(name) {
		const promise = new Promise(resolve => this.calls[`graphs_${name}`] = resolve)
		this.worker.postMessage({ table: 'graphs', key: name, method: 'GET' })
		return promise
	}

	getChar(char) {
		const promise = new Promise(resolve => this.calls[`chars_${char}`] = resolve)
		this.worker.postMessage({ table: 'chars', key: char, method: 'GET' })
		return promise
	}

	saveGraph(data) {
		requestIdleCallback(() => {
			const XMLS = new XMLSerializer()
			const entry = {
				name: data.name,
				node: XMLS.serializeToString(data.node),
				erase: XMLS.serializeToString(data.erase),
				color: data.color,
				date: data.date
			}
			this.worker.postMessage({ table: 'graphs', key: data.name, method: 'PUT', entry })
		})
	}

	saveChar(data) {
		requestIdleCallback(() => {
			const XMLS = new XMLSerializer()
			const entry = {
				name: data.name,
				string: data.string,
				viewBox: data.viewBox,
				node: XMLS.serializeToString(data.node),
				clips: data.clips.map(clip => XMLS.serializeToString(clip))
			}
			this.worker.postMessage({ table: 'chars', key: data.name, method: 'PUT', entry })
		})
	}

	saveChars(charsMap) {
		Object.entries(charsMap).forEach(([string, data]) => { this.saveChar({...data, string}) })
	}
})