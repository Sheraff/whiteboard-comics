/**
 * to go further: https://serviceworke.rs/push-get-payload_server_doc.html
 * need a node server, w/ a ./register page, web-push package, and VAPID_PUBLIC_KEY for encryption
 * needs to be SSL & HTTP/2 ?
 */

class NotificationEmitter {
	constructor() {

		// Respond to user clicking notification
		self.addEventListener('notificationclick', function (event) {
			console.log('[Service Worker] Notification click Received.');

			event.notification.close();

			event.waitUntil(
				clients.openWindow('http://localhost:5000')
			);
		});

		// sending notif after background sync (NOT ON STANDARD TRACKS)
		self.addEventListener('message', message => {
			if (!message.data.notifications)
				return
			self.registration.sync.register('example-sync')
		})
		self.onsync = event => {
			if (event.tag == 'example-sync') {
				self.registration.showNotification('coucou')
			}
		}

		// sending notif after receiving PUSH from server
		self.addEventListener('message', message => {
			if (!message.data.notifications)
				return
			self.registration.pushManager.getSubscription()
				.then(subscription => {
					if (subscription)
						return subscription
					const options = {
						applicationServerKey: urlBase64ToUint8Array('MY_SECURE_KEY')
					}
					return self.registration.pushManager.subscribe(options)
				})
				.then(subscription => {
					fetch('./register', {
						method: 'post',
						headers: {
							'Content-type': 'application/json'
						},
						body: JSON.stringify({
							subscription: subscription
						}),
					})
				})
		})
		self.addEventListener('push', event => {
			self.registration.pushManager.getSubscription()
				.then(function (subscription) {
					if (!subscription)
						throw new Error('user not regstered')
					return subscription.endpoint
				})
				.then(endpoint => fetch(`/push/${endpoint}`))
				.then(data => {
					self.registration.showNotification('coucou')
				})

		})
	}
}

function urlBase64ToUint8Array(base64String) {
	// from https://gist.github.com/malko/ff77f0af005f684c44639e4061fa8019
	const padding = '='.repeat((4 - base64String.length % 4) % 4)
	const base64 = (base64String + padding)
		.replace(/\-/g, '+')
		.replace(/_/g, '/')
		;
	const rawData = atob(base64)
	return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}