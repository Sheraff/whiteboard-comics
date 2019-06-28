let graphs = {}
let backlog = {}

onmessage = e => {
    const message = JSON.parse(e.data)
    switch(message.type) {
        case 'hydrate':
            graphs[message.data.name] = {content: message.data.content}
            if(backlog[message.data.name]) {
                backlog[message.data.name].forEach(message => request(message))
                delete backlog[message.data.name]
            }
            loadWhenIdle()
            break;
        case 'request':
            const name = message.data.name
            if (graphs[name]) {
                request(message)
            } else {
                if(!backlog[name])
                    backlog[name] = []
                backlog[name].push(message)
            }
            break;
    }
}

const request = (message) => {
    const name = message.data.name
    if(graphs[name].content)
        postMessage(JSON.stringify({
            name: name,
            content: graphs[name].content
        }))
    else if(graphs[name])
        loadItem(name, xml => postMessage(JSON.stringify({
            name: name,
            content: xml
        })))
    else
        throw `${name} hasn't registered yet`
}

// load item asap
const loadItem = (name, callback) => {
    if(!graphs[name].callbacks)
        graphs[name].callbacks = []
    graphs[name].callbacks.push(callback)
    if(graphs[name].isLoading)
        return 'isLoading'
    graphs[name].isLoading = true
    fetch('/svg.php?graph=' + name)
    .then(response => response.text())
    .then(xml => {
        graphs[name].content = xml
        graphs[name].callbacks.forEach(callback => callback(xml))
        delete graphs[name].callbacks
        delete graphs[name].isLoading
    })

}

// load item when idle for 500ms
let idleTimeout
const loadWhenIdle = () => {
    if(idleTimeout) clearTimeout(idleTimeout)
    idleTimeout = setTimeout(() => {
        const key = Object.keys(graphs).find(key => !graphs[key].content)
        if(key)
            loadItem(key, loadWhenIdle)
    }, 500)
}