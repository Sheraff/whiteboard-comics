function tsvToJson(tsv) {
	const array = tsv.split('\n')
	const headers = array.shift().split('\t')
	return array.map(item => {
		const json = {}
		item.split('\t').forEach((point, i) => json[headers[i]] = point)
		return json
	})
}

function cacheList(cache) {
	const url = '/data/graph_list.tsv'
	return new Promise(async (resolve, reject) => {
		const response = await cacheOrFetch(cache, url)
		if (!response)
			return reject()
		resolve()
		const fetched = await response.text()
		const data = tsvToJson(fetched)
	})
}