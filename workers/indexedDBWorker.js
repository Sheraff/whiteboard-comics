const getDB = new Promise((resolve, reject) => {
	const dbOpenRequest = indexedDB.open('whiteboard-db', 1)
	dbOpenRequest.onupgradeneeded = () => {
		const db = dbOpenRequest.result
		db.createObjectStore('graphs', { keyPath: 'name' })
		db.createObjectStore('chars', { keyPath: 'string' })
	}
	dbOpenRequest.onsuccess = () => {
		resolve(dbOpenRequest.result)
	}
	dbOpenRequest.onerror = e => reject(e)
})

function getEntry(table, key) {
	return new Promise((resolve, reject) => {
		getDB.then(db => {
			const tx = db.transaction(table, 'readonly')
			const store = tx.objectStore(table)
			const request = store.get(key)
			request.onsuccess = () => {
				resolve(request.result)
			}
			request.onerror = reject
		})
	})
}

function putEntry(table, entry) {
	return new Promise((resolve, reject) => {
		getDB.then(db => {
			const tx = db.transaction(table, 'readwrite')
			const store = tx.objectStore(table)
			const request = store.put(entry)
			request.onerror = reject
			request.onsuccess = () => resolve()
		})
	})
}

function patchEntry(table, key, entry) {
	return new Promise((resolve, reject) => {
		getDB.then(db => {
			const tx = db.transaction(table, 'readwrite')
			const store = tx.objectStore(table)
			const request = store.get(key)
			request.onerror = reject
			request.onsuccess = () => {
				const request = store.put(Object.assign(request.result, entry))
				request.onerror = reject
				request.onsuccess = () => resolve()
			}
		})
	})
}

function getGraph (key) {
	return getEntry('graphs', key).then(json => {
		if(json && json.node && json.erase && json.color)
			return json
	})
}

function getChar(key) {
	return getEntry('chars', key)
}

function putGraph(key, entry) {
	return putEntry('graphs', entry)
}

function putChar(key, entry) {
	return putEntry('chars', entry)
}

onmessage = ({ data: { table, key, method, entry } }) => {
	let fn
	if (table === 'graphs') {
		if (method === 'GET')
			fn = getGraph
		else if (method === 'PUT')
			fn = putGraph
	} else if (table === 'chars') {
		if (method === 'GET')
			fn = getChar
		else if (method === 'PUT')
			fn = putChar
	}

	fn(key, entry).then((result) => {
		if (method === 'GET')
			postMessage({ table, key, method, result })
	})
}