const ALPHABET = '../data/alphabet.json'

function matchAlphabetURL(url) {
	const match = url.match(/\/alphabet\/alphabet_(.*)\.svg$/)
	if (!match)
		return
	return match[1]
}

function makeAlphabetURL(char) {
	return `/alphabet/alphabet_${char}.svg`
}

async function fetchAndCache(cache, url) {
	const response = await fetch(url)
	if (response.status !== 200)
		return
	const responseToCache = response.clone()
	cache.put(url, responseToCache)
	return response
}

async function cacheOrFetch(cache, url) {
	const cached = await cache.match(url)
	if (cached)
		return cached
	return fetchAndCache(cache, url)
}

// TODO: store cache and fetch promises in a single state object to avoid sending 20x the same request

async function cacheAlphabet(cache) {
	const response = await cacheOrFetch(cache, ALPHABET)
	if (!response)
		return
	const fetched = await response.json()
	const data = fetched.chars
	return cache.addAll(data.map(makeAlphabetURL))
}

async function fetchLetter(CACHE_NAME, char) {
	if (!self.charMap) {
		const cache = await caches.open(CACHE_NAME)
		const alphabet = await fetchAndCache(cache, ALPHABET)
		if (!alphabet)
			return
		const fetched = await alphabet.json()
		self.charMap = new Map(fetched.chars)
	}
	if (!self.charMap.has(char))
		throw new Error(`character "${char}" is unlisted in ${ALPHABET}`)
	return fetch(makeAlphabetURL(char))
}