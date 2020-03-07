function matchStaticImageURL(url) {
	const match = url.match(/\/static\/graphs_(.*)\.png$/)
	if (!match) return false
	return match[1]
}

async function fetchStaticImage(CACHE_NAME, url) {
	const cache = await caches.open(CACHE_NAME)
	const cached = await cache.match(url)
	if (cached)
		return cached
	return new Response(false, { status: 404 })
}