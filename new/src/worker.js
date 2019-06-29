
// WORKER's data
let graphs = {} // list (key = graph.name) of registered graphs (an <svg-card> will register to the worker to make it known that it's initialized and can receive data)
let backlog = {} // list (key = graph.name) of graph specific requests received before graph was registered

// INDEXEDDB initialization
let idbDatabase
const dbPromise = new Promise((resolve, reject) => {
    if (idbDatabase)
        return resolve(idbDatabase)
    const dbOpenRequest = indexedDB.open('whiteboard-comics-db', 1)
    dbOpenRequest.onupgradeneeded = () => {
        const db = dbOpenRequest.result
        const store = db.createObjectStore('graphs', { keyPath: 'name' })
        store.createIndex('tags', 'tags', { multiEntry: true })
        store.createIndex('release', 'release')
        store.createIndex('noXML', 'noXML') // used for boredom loading to list all graphs that still don't have an XML loaded
    }
    dbOpenRequest.onsuccess = () => {
        const db = dbOpenRequest.result
        idbDatabase = db
        resolve(db)
    }
    dbOpenRequest.onerror = e => reject(e)
})
const store = (data) => {
    dbPromise.then(db => {
        if (data.name) {
            const tx = db.transaction('graphs', 'readwrite')
            const store = tx.objectStore('graphs')
            // check if XML is already stored
            const request = store.get(data.name)
            request.onsuccess = () => {
                if (!data.XML && (!request.result || !request.result.XML))
                    data.noXML = 1
                else if (data.XML)
                    data.noXML = 0
                if(request.result)
                    data = Object.assign(request.result, data)
                store.put(data)
            }
        } else {
            throw 'cant store without keyPath {name}'
        }
    })
}
const get = (name) => {
    return new Promise((resolve, reject) => {
        dbPromise.then(db => {
            const tx = db.transaction('graphs', 'readonly')
            const store = tx.objectStore('graphs')
            resolve(store.get(name).result)
        }).catch(e => {
            reject(e)
        })
    })
}

// WORKER's endpoint
onmessage = e => {
    const message = JSON.parse(e.data)
    switch (message.type) {
        case 'hydrate':
            // hydrate graphs && respond to backlog AFTER store(), with data from IndexedDB
            graphs[message.data.name] = { XML: message.data.XML }
            if (backlog[message.data.name]) { 
                backlog[message.data.name].forEach(message => request(message))
                delete backlog[message.data.name]
            }
            store({ name: message.data.name })
            loadWhenIdle()
            break;
        case 'request':
            const name = message.data.name
            if (graphs[name]) {
                request(message)
            } else {
                if (!backlog[name])
                    backlog[name] = []
                backlog[name].push(message)
            }
            break;
    }
}

const request = (message) => {
    const name = message.data.name
    // data is already stored in worker
    if (graphs[name].XML) {
        postMessage(JSON.stringify({
            name: name,
            XML: graphs[name].XML
        }))
        // graph is registered but doesn't have data
    } else if (graphs[name]) {
        const resolve = (graph) => {
            Object.assign(graphs[name], graph)
            postMessage(JSON.stringify(graph))
        }
        // graph is stored locally in IndexedDB
        get(name).then(graph => {
            resolve(graph)
        }).catch(e => {
            // load graph from server
            loadItem(name, XML => resolve({ name, XML }))
        })
        // graph isn't registered
    } else
        throw `${name} hasn't registered yet`
}

// load item asap
const loadItem = (name, callback) => {
    if (!graphs[name].callbacks)
        graphs[name].callbacks = []
    graphs[name].callbacks.push(callback)
    if (graphs[name].isLoading)
        return 'isLoading'
    graphs[name].isLoading = true
    fetch('/svg.php?graph=' + name)
        .then(response => response.text())
        .then(XML => {
            graphs[name].XML = XML
            graphs[name].callbacks.forEach(callback => callback(XML))
            delete graphs[name].callbacks
            delete graphs[name].isLoading
            store({ name, XML })
        })

}

// load item when idle for 500ms
let idleTimeout
const loadWhenIdle = () => {
    if (idleTimeout) clearTimeout(idleTimeout)
    idleTimeout = setTimeout(() => {

        dbPromise.then(db => {
            const tx = db.transaction('graphs', 'readonly')
            const store = tx.objectStore('graphs')
            const index = store.index('noXML')
            const request = index.get(1)
            request.onsuccess = () => {
                if (request.result) {
                    const name = request.result.name
                    console.log(`boredom loading ${name}`)
                    loadItem(name, loadWhenIdle)
                }
            }
            request.onerror = e => { throw e }
        }).catch(e => { throw e })

    }, 1000)
}