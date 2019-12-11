const ALPHABET = '/data/alphabet.json'

function matchAlphabetURL(url) {
	const match = url.match(/^\/alphabet\/alphabet_(.*)\.svg$/)
	if(!match) return false
	return match[1]
}

function makeAlphabetURL(char) {
	return `/alphabet/alphabet_${char}.svg`
}

async function fetchAndCache(cache, url) {
	const response = await fetch(url)
	if (!response || response.status !== 200)
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

async function cacheAlphabet(cache) {
	const response = await cacheOrFetch(cache, ALPHABET)
	const fetched = await response.json()
	const data = fetched.chars
	return cache.addAll(data.map(makeAlphabetURL))
}

async function fetchLetter(CACHE_NAME, char) {
	const cache = await caches.open(CACHE_NAME)
	const alphabet = await fetchAndCache(cache, ALPHABET)
	const fetched = await alphabet.json()
	const data = fetched.chars
	if (!data[char])
		throw new Error(`character "${char}" is unlisted in ${ALPHABET}`)
	return fetch(makeAlphabetURL(char))
}