import IdlePromise from '../modules/IdlePromise.js'

export default function svgToImageBlob(node) {

	return new IdlePromise(async function*(resolve, reject) {
		yield
		const clone = node.cloneNode(true)
		yield
		const elements = node.querySelectorAll(':scope *:not(text):not(tspan)')
		yield
		const clonedElements = Array.from(clone.querySelectorAll(':scope *:not(text):not(tspan)'))
		yield
		const clonedDefs = document.querySelector('#defs').firstElementChild.cloneNode(true)

		yield
		clone.style.backgroundColor = 'white'
		clone.appendChild(clonedDefs)

		yield
		clonedElements.forEach((clonedElement, index) => {
			const styles = getComputedStyle(elements[index])
			clonedElement.setAttribute('style', `
					fill: ${styles.getPropertyValue('fill')};
					stroke-linecap: ${styles.getPropertyValue('stroke-linecap')};
					stroke-linejoin: ${styles.getPropertyValue('stroke-linejoin')};
					stroke-miterlimit: ${styles.getPropertyValue('stroke-miterlimit')};
					stroke: ${styles.getPropertyValue('stroke')};
					stroke-width: ${styles.getPropertyValue('stroke-width')};
					stroke-dasharray: initial;
					stroke-dashoffset: initial;
				`)
		})
		yield
		Array.from(clone.querySelectorAll('text')).forEach(text => text.style.display = 'none')

		// SVG Node => XML string => data url blob => canvas => jpeg blob => transferable array buffer
		yield
		const svgString = new XMLSerializer().serializeToString(clone)
		yield
		const [, , boxWidth, boxHeight] = clone.getAttribute('viewBox').split(' ')
		const width = 800
		const height = 800 / boxWidth * boxHeight
		const dimensions = { width, height }

		yield
		const blob = new Blob([svgString], { type: 'image/svg+xml' })
		yield
		const blobDataURL = URL.createObjectURL(blob)

		yield
		const img = new Image(width, height)
		img.src = blobDataURL
		await new Promise(resolve => img.addEventListener('load', resolve))
		URL.revokeObjectURL(blobDataURL)

		yield
		const canvas = document.createElement('canvas')
		canvas.setAttribute('width', dimensions.width)
		canvas.setAttribute('height', dimensions.height)
		const context = canvas.getContext('2d')
		context.drawImage(img, 0, 0, dimensions.width, dimensions.height)

		// const pngDataURL = canvas.toDataURL('image/png', 1)
		yield
		canvas.toBlob(async blob => {
			const buffer = blob.arrayBuffer()
			resolve(buffer)
			URL.revokeObjectURL(blob)
		}, 'image/jpeg', 0.9)
	})
}