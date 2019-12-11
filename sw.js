self.importScripts('/sw/Debouncer.js')
self.importScripts('/sw/alphabetCaching.js')

const CACHE_NAME = 'whiteboard-files-cache-v0'
const URLS = [
	'/',
	'/style.css',
	'/script.js',
	'/modules/requestIdleNetwork.js',
	'/modules/IdleStack.js',
	'/data/graph_list.tsv',
	'/components/Card.js',
	'https://fonts.googleapis.com/css?family=Permanent+Marker&display=block',
]

self.addEventListener('install', event => event.waitUntil(
	caches.open(CACHE_NAME)
		.then(async cache => Promise.all([
			cache.addAll(URLS),
			await cacheAlphabet(cache),
		]))
		.catch(() => console.warn('URLS list of forced caches is wrong'))
))

// notify clients that SW can listen to messages
self.addEventListener('activate', event => event.waitUntil(
	self.clients.claim().then(async () => {
		const clients = await self.clients.matchAll()
		clients.forEach(client => client.postMessage({ active: true }))
	})
))

const debouncer = new Debouncer(self)

self.addEventListener('fetch', event => event.respondWith(
	caches.match(event.request).then(cached => {
		// Cache hit - return response
		if (cached)
			return cached

		debouncer.pause()

		// Request
		const letter = matchAlphabetURL(event.request.url)
		return letter
			? fetchLetter(CACHE_NAME, letter)
			: fetch(event.request)

	}).then(response => {
		debouncer.start()

		// Bad response, don't cache
		if (!response || response.status !== 200 || response.type !== 'basic')
			return response

		// Cache response
		const responseToCache = response.clone()
		caches.open(CACHE_NAME)
			.then(cache => cache.put(event.request, responseToCache))
		return response;
	})
))