let graphs
let loadList = []
let isLoading
let backlog = []
let idleTimeout

onmessage = e => {
    const data = JSON.parse(e.data)
    if (data.graphs) {
        graphs = data.graphs
        postMessage(JSON.stringify({ready: true}))
        backlog.forEach(data => respond(data))
        loadWhenIdle()
    } else if (graphs) {
        respond(data)
    } else {
        backlog.push(data)
    }
}

const respond = (data) => {
    if (data.raw) {
        if(graphs[data.raw].content)
            postMessage(JSON.stringify({[graphs[data.raw].name]: graphs[data.raw].content}))
        else {
            loadList.unshift({
                key: graphs[data.raw].key,
                callback: xml => postMessage(JSON.stringify({[graphs[data.raw].name]: xml}))
            })
            if(!isLoading)
                loadOne()
        }
    }
}

const loadWhenIdle = () => {
    if(idleTimeout) clearTimeout(idleTimeout)
    idleTimeout = setTimeout(() => {
        const key = graphs.findIndex(graph => !graph.content)
        if(key!==-1) {
            console.log('boredom loading', key)
            loadList.push({key})
            loadOne()
        } else {
            console.log('all done loading')
        }
    }, 500)
}

const loadOne = () => {
    isLoading = true
    const loaditem = loadList.shift()

    const resolve = (xml) => {
        graphs[loaditem.key].content = xml
        if(loaditem.callback)
            loaditem.callback(xml)
        if(loadList.length) {
            loadOne()
        } else {
            isLoading = false
            loadWhenIdle()
        }
    }

    if(!!graphs[loaditem.key].content)
        resolve(graphs[loaditem.key].content)
    else {
        fetch(graphs[loaditem.key].path)
        .then(response => response.text())
        .then(xml => resolve(xml))
    }
}


// load all from list in order, one at a time. If we get a load request, it takes priority. If all load requests have been processed, resume loading in order.