class IndexedDBManager {
	save(data) {
		switch (data.type) {
			case 'graph':
				saveGraph(data)
				break;
			default:
				throw new Error(`Unknown table ${data.type}`)
		}
	}

	saveGraph(data) {
		return new Promise((resolve, reject) => {
			this.getDB().then(db => {
				if (!data.name)
					throw new Error(`Can't store graph without 'name' key`)
				const tx = db.transaction('graphs', 'readwrite')
				const store = tx.objectStore('graphs')
				const request = store.get(data.name)
				request.onsuccess = () => {
					const result = store.put({
						name: data.name,
						node: data.node.outerHTML
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
				Promise.all(Object.keys(data).map(char => (
					new Promise((resolve, reject) => {
						const request = store.get(char)
						request.onsuccess = () => {
							const charData = data[char]
							const result = store.put({
								char,
								node: charData.node.outerHTML,
								clips: JSON.stringify(charData.clips.map(clip => clip.outerHTML))
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
				db.createObjectStore('chars', { keyPath: 'char' })
			}
			dbOpenRequest.onsuccess = () => {
				this.idbDatabase = dbOpenRequest.result
				resolve(this.idbDatabase)
			}
			dbOpenRequest.onerror = e => reject(e)
		})
	}
}

let singleton

export default class {
	constructor() {
		if (!singleton)
			singleton = new IndexedDBManager()
		return singleton
	}
}