class IndexedDBManager {

	saveGraph(data) {
		return new Promise((resolve, reject) => {
			this.getDB().then(db => {
				if (!data.name)
					throw new Error(`Can't store graph without 'name' key`)
				const tx = db.transaction('graphs', 'readwrite')
				const store = tx.objectStore('graphs')
				const request = store.get(data.name)
				const XMLS = new XMLSerializer()
				request.onsuccess = () => {
					const result = store.put({
						name: data.name,
						node: XMLS.serializeToString(data.node)
					})
					resolve(result)
				}
				request.onerror = reject
			})
		})
	}

	saveChars(data) {
		return new Promise((resolve, reject) => {
			this.getDB().then(db => {
				const tx = db.transaction('chars', 'readwrite')
				const store = tx.objectStore('chars')
				const XMLS = new XMLSerializer()
				Promise.all(Object.keys(data).map(string => (
					new Promise((resolve, reject) => {
						const request = store.get(string)
						request.onsuccess = () => {
							const charData = data[string]
							const node = XMLS.serializeToString(charData.node)
							const clips = charData.clips.map(clip => XMLS.serializeToString(clip))
							const result = store.put({
								name: charData.name,
								string,
								node,
								clips,
								viewBox: charData.viewBox
							})
							resolve(result)
						}
						request.onerror = reject
					})
				)))
				.catch(reject)
				.then(resolve)
			})
		})
	}

	getChar(char) {
		return new Promise((resolve, reject) => {
			this.getDB().then(db => {
				const tx = db.transaction('chars', 'readwrite')
				const store = tx.objectStore('chars')
				const request = store.get(char)
				request.onsuccess = () => {
					resolve(request.result)
				}
				request.onerror = reject
			})
		})
	}

	getDB() {
		return new Promise((resolve, reject) => {
			if (this.idbDatabase)
				return resolve(this.idbDatabase)
			const dbOpenRequest = indexedDB.open('whiteboard-db', 1)
			dbOpenRequest.onupgradeneeded = () => {
				const db = dbOpenRequest.result
				db.createObjectStore('graphs', { keyPath: 'name' })
				const charsStore = db.createObjectStore('chars', { keyPath: 'string' })
				// charsStore.createIndex("string", "string", { unique: true });
			}
			dbOpenRequest.onsuccess = () => {
				this.idbDatabase = dbOpenRequest.result
				resolve(this.idbDatabase)
			}
			dbOpenRequest.onerror = e => reject(e)
		})
	}
}

export default class Singleton {
	static singleton
	constructor() {
		if (!Singleton.singleton)
			Singleton.singleton = new IndexedDBManager()
		return Singleton.singleton
	}
}