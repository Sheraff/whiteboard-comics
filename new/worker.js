let graphs

let backlog = []
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
        else
            loadItem(data.raw, xml => postMessage(JSON.stringify({[graphs[data.raw].name]: xml})))
    }
}

// load item asap
const loadItem = (index, callback) => {
    if(!graphs[index].callbacks)
        graphs[index].callbacks = []
    graphs[index].callbacks.push(callback)
    if(graphs[index].isLoading)
        return
    graphs[index].isLoading = true
    fetch('./svg.php?graph=' + graphs[index].name)
    .then(response => response.text())
    .then(xml => {
        graphs[index].content = xml
        graphs[index].callbacks.forEach(callback => callback(xml))
        delete graphs[index].callbacks
        delete graphs[index].isLoading
    })

}

// load item when idle for 500ms
let idleTimeout
const loadWhenIdle = () => {
    if(idleTimeout) clearTimeout(idleTimeout)
    idleTimeout = setTimeout(() => {
        const key = graphs.findIndex(graph => !graph.content)
        if(key!==-1)
            loadItem(key, loadWhenIdle)
    }, 500)
}