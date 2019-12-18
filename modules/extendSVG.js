let extended = false

export default function extendSVG() {
	if (extended)
		return

	extended = true

	const pythagoras = (A, B) => Math.sqrt(Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2))

	SVGElement.prototype.hasLength = function () {
		return ['line', 'polyline', 'path'].includes(this.tagName)
	}

	SVGElement.prototype.isGroup = function () {
		return ['svg', 'g'].includes(this.tagName)
	}

	SVGElement.prototype.isText = function () {
		return ['text', 'tspan'].includes(this.tagName)
	}

	SVGLineElement.prototype.getTotalLength = function () {
		return pythagoras([this.getAttribute('x1'), this.getAttribute('y1')], [this.getAttribute('x2'), this.getAttribute('y2')])
	}

	SVGPolylineElement.prototype.getTotalLength = function () {
		return this.getAttribute('points').trim().split(' ')
			.map(point => point.split(',').map(parseFloat))
			.reduce((acc, point, index, points) => { return index > 0 && acc + pythagoras(points[index - 1], point) }, 0)
	}

	SVGGraphicsElement.prototype.getStaticTotalLength = function () {
		if ('staticTotalLength' in this)
			return this.staticTotalLength
		this.staticTotalLength = this.getTotalLength()
		return this.staticTotalLength
	}
}