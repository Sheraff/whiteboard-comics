export default function SVGToPNG(node) {

	return new Promise(async resolve => {
		const clone = node.cloneNode(true)
		const elements = node.querySelectorAll(':scope *:not(text):not(tspan)')
		const clonedElements = Array.from(clone.querySelectorAll(':scope *:not(text):not(tspan)'))
		const clonedDefs = document.querySelector('#defs').firstElementChild.cloneNode(true)

		clone.style.backgroundColor = 'white'
		clone.appendChild(clonedDefs)

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
		Array.from(clone.querySelectorAll('text')).forEach(text => text.style.display = 'none')

		// SVG => XML (img.src) => canvas => data => png
		const svgString = new XMLSerializer().serializeToString(clone)
		const [, , width, height] = clone.getAttribute('viewBox').split(' ')
		const dimensions = {
			width: 800,
			height: 800 / width * height
		}

		const blob = new Blob([svgString], { type: 'image/svg+xml' })
		const blobDataURL = URL.createObjectURL(blob)

		const img = new Image()
		img.src = blobDataURL

		await new Promise(resolve => img.addEventListener('load', resolve))
		
		console.log('loaded')
		const canvas = document.createElement('canvas')
		canvas.setAttribute('width', dimensions.width)
		canvas.setAttribute('height', dimensions.height)

		const context = canvas.getContext('2d')
		context.drawImage(img, 0, 0, dimensions.width, dimensions.height)

		const pngDataURL = context.canvas.toDataURL('image/png', 1)

		URL.revokeObjectURL(blobDataURL)
		resolve(pngDataURL)
		URL.revokeObjectURL(pngDataURL)
	})
}