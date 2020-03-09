self.importScripts('./sw/Debouncer.js')
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
	// '/interfaces/SWState.js',
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

self.addEventListener('message', ({ data: { port, id, target } }) => {
	if (!port) return
	switch (target) {
		case 'debouncer':
			debouncer.listenToMessages(port, id)
			break
		case 'jpegBlobUploader':
			console.log('passing SW message to Jpeg Blob Uploader', id, port)
			jpegBlobUploader.listenToMessages(port, id)
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
const jpegBlobUploader = new JpegBlobUploader(self)

self.addEventListener('fetch', event => event.respondWith(
	caches.match(event.request).then(async (cached) => {
		if (cached)
			return cached

		debouncer.startFetching()
		const response = await dispatchRequest(event.request)
		debouncer.endFetching()

		if (response)
			return response

		return new Response(null)
	})
))

async function dispatchRequest(request) {

	const letter = matchAlphabetURL(request.url)
	if (letter)
		return await fetchLetter(CACHE_NAME, letter)

	const staticImg = matchStaticImageURL(request.url)
	if (staticImg)
		return await fetchStaticImage(CACHE_NAME, request.url)

	const response = await fetch(request)
	if (response.status === 200 && (response.type === 'basic' || response.type === 'default')) {
		const responseToCache = response.clone()
		caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache))
	}
	return response
}