self.importScripts('./sw/Debouncer.js')
self.importScripts('./sw/CacheUploader.js')
self.importScripts('./sw/alphabetCaching.js')
self.importScripts('./sw/staticImagesCaching.js')
// self.importScripts('./sw/NotificationEmitter.js')

// new NotificationEmitter()

const CACHE_NAME = 'whiteboard-files-cache-v0'
const URLS = [
	// '/',
	// '/manifest.json',
	// '/style.css',
	// '/script.js',
	// '/functions/extendSVG.js',
	// '/functions/hex2hsl.js',
	// '/functions/SVGToPNG.js',
	// '/interfaces/IdleNetwork.js',
	// '/interfaces/IndexedDB.js',
	// '/interfaces/ServiceWorkerState.js',
	// '/modules/Alphabet.js',
	// '/modules/IdlePromise.js',
	// '/modules/ReadySVGNode.js',
	// '/modules/SVGAnim.js',
	// '/modules/TextToAlphabet.js',
	// '/workers/idleNetworkWorker.js',
	// '/workers/indexedDBWorker.js',
	// '/data/graph_list.tsv',
	// '/data/alphabet.json',
	// '/components/Card.css',
	// '/components/Card.js',
	// '/components/Grid.js',
	'https://fonts.googleapis.com/css?family=Permanent+Marker&display=block',
]

self.addEventListener('message', ({data: {port, id, target}}) => {
	if(!port) return
	switch(target) {
		case 'debouncer':
			debouncer.listenToMessages(port, id)
			break
		case 'cacheUploader':
			cacheUploader.listenToMessages(port, id)
			break
		default:
			console.warn('Unknown message channel in SW:', target)
	}
})

self.addEventListener('install', event => {
	self.skipWaiting()
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(URLS))
			.catch(() => console.warn('URLS list of forced caches is wrong'))
	)
})

// notify clients that SW can listen to messages
self.addEventListener('activate', event => {
	event.waitUntil(
		self.clients.claim()
	)
})

const debouncer = new Debouncer(self)
const cacheUploader = new CacheUploader(self)

self.addEventListener('fetch', event => event.respondWith(
	caches.match(event.request).then(cached => {
		// Cache hit - return response
		if (cached)
			return { response: cached, cached: true }

		debouncer.startFetching()

		// Request
		const letter = matchAlphabetURL(event.request.url)
		if(letter)
			return { response: fetchLetter(CACHE_NAME, letter) }

		const staticImg = matchStaticImageURL(event.request.url)
		if(staticImg)
			return { response: fetchStaticImage(CACHE_NAME, event.request.url) }

		return { response: fetch(event.request) }

	}).then(({ response, cached }) => {
		if (!cached)
			debouncer.endFetching()

		// Bad response, don't cache
		if (!response || response.status !== 200 || response.type !== 'basic')
			return response

		// Cache response // TODO: not caching anything...
		const responseToCache = response.clone()
		caches.open(CACHE_NAME)
			.then(cache => cache.put(event.request, responseToCache))
		return response
	}).catch(() => {
		console.error(event)
	})
))