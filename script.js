	// DEBUG: when a new graph is published, if you go to the root address whiteboard-comics.com, you see AS A FIRST GRAPH / LATEST RELEASE the latest release from your last visit
	// 	this is because when writing a history.state in JS, I associate an index (temporary based on latest release) with a URL (permanent based on filename)
	// 	SOLUTION: history.state should only containt stuff that is permanent

///////////////////////
// UTILS + POLYFILLS //
///////////////////////

function pythagore (A, B) {
  return Math.sqrt(Math.pow(A[0]-B[0], 2) + Math.pow(A[1]-B[1], 2))
}

SVGLineElement.prototype.getTotalLength = function () {
	return pythagore([this.getAttribute('x1'), this.getAttribute('y1')], [this.getAttribute('x2'), this.getAttribute('y2')])
}

SVGPolylineElement.prototype.getTotalLength = function () {
	var distance = 0, points = this.getAttribute('points').split(' ')
	for (var i = 0, l = points.length-2; i < l; i++) {
		distance += pythagore(points[i].split(',').map(parseFloat), points[i+1].split(',').map(parseFloat))
	}
	return distance
}

String.prototype.toProperCase = function () {
	return this.replace(/\w\S*/g, function(txt){
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
	})
}

Date.prototype.getLitteralMonth = function () {
	var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
	return monthNames[this.getMonth()]
}

Date.prototype.getDatePostfix = function () {
	var date = this.getDate()
	if(date>3&&date<21)
		return 'th'
	switch (date%10){
		case 1:
			return 'st'
		case 2:
			return 'nd'
		case 3:
			return 'rd'
		default:
			return 'th'
	}
}

function find_needle_with_key (needle, key) {
	var index = -1
  for (var i = 0, l = GRAPHS.length; i < l; i++) {
	  if(GRAPHS[i][key] === needle){
	  	index = i
	  	break
	  }
	}
	return index
}

function get_DOM (data) { // debug, this is hacky: this function is used when i have no idea why a variable contains a DOM element and not a string and vice-versa.
  if(typeof data === 'string'){
    var el = document.createElement('div')
    el.innerHTML = data
    return el.firstElementChild
  } else
    return data
}





/////////////////////////////
// GLOBALS & LOCAL STORAGE //
/////////////////////////////

var ANIMATE = localStorage.getItem('animate')===null ? document.getElementById('animation_check').checked : localStorage.getItem('animate')
var SPEED = localStorage.getItem('speed') || 4
var SIZE_FACTOR = 1.4
var ERASED

if(ANIMATE==="false") ANIMATE = false
if(ANIMATE==="true") ANIMATE = true
document.getElementById('animation_check').checked = ANIMATE
document.getElementById('speed_input').value = SPEED



////////////
// SCRIPT //
////////////

var recovered_index = -1;
if(history.state && history.state.name)
	recovered_index = find_needle_with_key(history.state.name, 'name')
if(recovered_index !== -1){
	console.log('state recovered from history: asking for index ' + recovered_index + ', graph @ ' + GRAPHS[recovered_index].name)
  load_svg(INDEX, refresh_svg.bind(undefined, recovered_index))
} else {
	// create history state if there is none
	console.log('replaceState to create history state: asking for index ' + INDEX + ', graph @ ' + GRAPHS[INDEX].name)
	window.history.replaceState({name: GRAPHS[INDEX].name}, "", GRAPHS[INDEX].name)
  load_svg(INDEX, refresh_svg.bind(undefined, INDEX))
}

function initialize () {
	ERASED = false
	var svg = document.querySelector('main svg')

	update_link_state()
	properly_size_svg()
	update_page_title()
	update_logo_colors()

	// animate svg
	var total_duration = play_svg(svg, .5)
	if(!ANIMATE)
		force_finish_drawing_element_svg(svg)

	// preload next graph
	if(GRAPHS[INDEX+1])
		load_svg(INDEX+1, setup_page.bind(undefined, INDEX+1))
}



/////////////////
// INTERACTION //
/////////////////

document.querySelector('aside #logo').parentElement.addEventListener('click', navigate.bind(undefined, 0))
document.querySelector('aside h2').parentElement.addEventListener('click', navigate.bind(undefined, 0))
document.getElementById('prev').addEventListener('click', function(event) { if(this.classList.contains('disabled')) { event.stopPropagation(); event.preventDefault(); return} navigate(-1, event) } )
document.getElementById('next').addEventListener('click', function(event) { if(this.classList.contains('disabled')) { event.stopPropagation(); event.preventDefault(); return} navigate(1, event) } )

function navigate (direction, event) {
	event.stopPropagation()
	event.preventDefault()

	var svg = document.querySelector('main svg')
	interrupt_drawing_element_svg(svg)
	if(ANIMATE)
		erase(svg, 0, setup_page.bind(undefined, direction===0?0:(INDEX+direction)))
	else
		ERASED = true
	load_svg(direction===0?0:(INDEX+direction), setup_page.bind(undefined, direction===0?0:(INDEX+direction)))
}

document.getElementById('speed_input').addEventListener('change', function (event) {
	SPEED = this.value
	localStorage.setItem('speed', this.value)
})

document.getElementById('animation_check').addEventListener('change', function (event) {
	ANIMATE = this.checked
	localStorage.setItem('animate', this.checked)
	var svg = document.querySelector('main svg')
	if(ANIMATE)
		play_svg(svg, 0)
	else
		force_finish_drawing_element_svg(svg)
})


////////////////
// AESTHETICS //
////////////////

function update_page_title () {
  document.title = 'Whiteboard Comics — ' + GRAPHS[INDEX].formatted_name
}

function update_logo_colors () {
  var arrow = document.querySelectorAll('#logo path[stroke]:not([stroke="#000000"]), #logo polyline[stroke]:not([stroke="#000000"])')
  var color = document.querySelector('main svg path[stroke], main svg polyline[stroke]').getAttribute('stroke')
  for (var i = 0, l = arrow.length; i < l; i++) {
    arrow[i].style.stroke = color
  }
}

function update_link_state () {
	var prev = document.getElementById('prev')
  if(INDEX===0) {
  	prev.classList.add('disabled')
  	prev.setAttribute('href', '#')
  } else {
		prev.classList.remove('disabled')
		prev.setAttribute('href', '/'+GRAPHS[INDEX-1].name)
	}

	var next = document.getElementById('next')
  if(INDEX===GRAPHS.length-1) {
  	next.classList.add('disabled')
  	next.setAttribute('href', '#')
  } else {
		next.classList.remove('disabled')
		next.setAttribute('href', '/'+GRAPHS[INDEX+1].name)
	}
}

function properly_size_svg () {
	// uniformly size svg (this assumes a viewbox < 1000x1000 when SIZE_FACTOR is set to 1)

	var svg = document.querySelector('main svg')
	if(!svg)
		return
	var viewbox = svg.getAttribute('viewBox').split(' ')
	var parent = svg.parentElement.getBoundingClientRect()

	var reference_dimension = Math.min(parent.width, parent.height)
	svg.style.width = SIZE_FACTOR * reference_dimension * viewbox[2]/1000
	svg.style.height = SIZE_FACTOR * reference_dimension * viewbox[3]/1000

}

window.addEventListener('resize', properly_size_svg)

/////////////////
// URL REWRITE //
/////////////////

function setup_page (index, force) {
	if(!force && (!ERASED || !(GRAPHS[index] && GRAPHS[index].content)))
		return
	if(history.state && history.state.name && GRAPHS[index] && history.state.name===GRAPHS[index].name)
		window.history.replaceState({name: GRAPHS[index].name}, "", GRAPHS[index].name)
	else
		window.history.pushState({name: GRAPHS[index].name}, "", GRAPHS[index].name)
	refresh_svg(index)
}

// enable browser history navigation
window.onpopstate = function (event) {
	if(!event.state)
		return
	var index = -1
	if(event.state.name)
		index = find_needle_with_key(event.state.name, 'name')
	if(index!==-1)
		refresh_svg(index)
	else
		refresh_svg(0)
}

// display SVG based on its index
function refresh_svg (index) {
	if(!GRAPHS[index] || !GRAPHS[index].content){
		console.log('GRAPHS has no entry for INDEX or entry is empty, requesting...')
		return load_svg(index, setup_page.bind(undefined, index, true))
	}

	// replace old svg with new one
	INDEX = index
  var svg = document.querySelector('main svg')
	svg.parentNode.replaceChild(get_DOM(GRAPHS[INDEX].content), svg)
  svg = document.querySelector('main svg')

	// remove old authorship span (if existing) and add new one (if given)
	var authorship = document.getElementById('authorship')
	if(authorship)
		authorship.parentElement.removeChild(authorship)
	if(GRAPHS[INDEX].author){
    var span = document.createElement('span')
    span.setAttribute('id', 'authorship')
    span.innerHTML = GRAPHS[INDEX].credit
    var a = document.createElement('a')
    a.className = 'credits'
    a.setAttribute('href', GRAPHS[INDEX].source)
    a.setAttribute('target', '_blank')
    a.innerHTML = GRAPHS[INDEX].author
    span.appendChild(a)
		svg.parentElement.appendChild(span)
  }

	// add/update date of publication
	var pubdate = document.getElementById('pubdate')
	if(!pubdate){
		pubdate = document.createElement('span')
		pubdate.id = 'pubdate'
		svg.parentElement.appendChild(pubdate)
	}
	var date_obj = new Date(GRAPHS[INDEX].release[1] + ' / ' + GRAPHS[INDEX].release[2] + ' / ' + GRAPHS[INDEX].release[0])
	pubdate.innerHTML = 'published on ' + date_obj.getLitteralMonth() + ' ' + parseInt(GRAPHS[INDEX].release[2]) + date_obj.getDatePostfix() + ', ' + GRAPHS[INDEX].release[0]

	initialize()
}

////////////////////
// AJAX FUNCTIONS //
////////////////////

function load_svg (index, callback) {
	if(GRAPHS[index] && GRAPHS[index].content)
		return preprocess_svg(index, callback)

  var httpRequest = new XMLHttpRequest()
	httpRequest.onreadystatechange = loaded_svg.bind(undefined, index, httpRequest, callback)
	httpRequest.open('GET', GRAPHS[index].path)
	httpRequest.send()
}

function loaded_svg (index, httpRequest, callback) {
	if (httpRequest.readyState === XMLHttpRequest.DONE) {
		if (httpRequest.status === 200) {
			GRAPHS[index].content = get_DOM(httpRequest.responseText)
			preprocess_svg(index, callback)
		} else {
			setTimeout(load_svg.bind(undefined, index, callback), 1000)
		}
	}
}

function preprocess_svg (index, callback) {
  if(!GRAPHS[index].is_processed){
    console.log('preprocessing '+GRAPHS[index].name)
    var svg = get_DOM(GRAPHS[index].content)
    var erase = svg.removeChild(svg.getElementsByTagName('path')[0])
    erase.setAttribute('data-type', 'erase')
    erase.setAttribute('stroke', 'transparent')
    svg.appendChild(erase)
    GRAPHS[index].content = rewrite_with_paths(svg)
    GRAPHS[index].is_processed = true
  }
  callback()
}


//////////////////////////////
// SVG FONT TO PATH LIBRARY //
//////////////////////////////

function rewrite_with_paths (svg) {
	var texts = svg.getElementsByTagName('text')
	for (var text_pointer = 0; text_pointer < texts.length; text_pointer++) {
		var text = texts[text_pointer]

		var tspans = text.getElementsByTagName('tspan')
		if(tspans.length===0){
			replace_span(text)
		} else {
			for (var i = 0; i < tspans.length; i++) {
				replace_span(tspans[i])
			}
		}
	}
  return svg

	function replace_span (reference_element) {
		if(reference_element.childNodes.length>1 || reference_element.childNodes[0].nodeType!==3){
			console.log(reference_element.childNodes)
			return console.log('this node still has children')
		}

		var is_tspan = reference_element.tagName.toLowerCase()==='tspan'

		var text_position = is_tspan ? reference_element.parentElement.getAttribute('transform') : reference_element.getAttribute('transform')
		text_position = text_position.slice(7,-1).split(' ')
		text_position = {
			x: parseFloat(text_position[4]),
			y: parseFloat(text_position[5])
		}
		if(is_tspan){
				text_position.x += parseFloat(reference_element.getAttribute('x'))
				text_position.y += parseFloat(reference_element.getAttribute('y'))
		}

		var color = reference_element.getAttribute('fill')
		if(!color)
			color = is_tspan ? reference_element.parentElement.getAttribute('fill') : false

		var sentence = reference_element.childNodes[0].nodeValue
		var insert_at = is_tspan ? reference_element.parentElement : reference_element
		var char_pointer = 0
		var x_length = 0
		for (var char_pointer = 0; char_pointer < sentence.length; char_pointer++) {
			if(sentence[char_pointer]===' '){
				x_length+=10
				continue
			}

			var letter = get_letter(sentence.charAt(char_pointer))
			if(!letter)
				continue
			var el = document.createElementNS('http://www.w3.org/2000/svg', 'g')
			el.innerHTML = letter.content
			var paths = el.querySelectorAll('path,line,polyline')
			for (var i = 0; i < paths.length; i++) {
				var x = text_position.x + x_length
				var y = text_position.y - letter.viewbox.height + 10
				paths[i].setAttribute('transform', 'translate(' + x + ',' + y + ')')
				paths[i].setAttribute('data-type','writing')
				if(color)
					paths[i].setAttribute('stroke', color)
				insert_at.parentNode.insertBefore(paths[i], insert_at)
			}
			x_length += letter.viewbox.width + .5
		}
		reference_element.style.display = 'none'
	}

	function get_letter(letter) {
		for (var i = 0; i < LETTERS.length; i++) {
			if(LETTERS[i].letter===letter){
        if(!LETTERS[i].viewbox)
          LETTERS[i] = compute_letter(LETTERS[i])
        return LETTERS[i]
      }
		}
		console.log('letter "'+letter+'" not found')
		return false
	}

  function compute_letter(letter){
    var el = document.createElement('div')
  	el.innerHTML = letter.content
  	el = el.getElementsByTagName('svg')[0]
  	var viewbox = (el.getAttribute('viewbox') || el.getAttribute('viewBox')).split(' ')
  	letter.viewbox = {
  		width: parseFloat(viewbox[2]),
  		height: parseFloat(viewbox[3])
  	}
  	letter.content = el.innerHTML
    return letter
  }
}


///////////////////////////
// SVG ANIMATION LIBRARY //
///////////////////////////

function erase (svg, delay, callback) {
	if(ERASED)
		return callback()
  var erase_path = svg.querySelector('[data-type="erase"]')
  if(!erase_path){
    ERASED = true
    return callback()
  }
  start_drawing_element(erase_path, delay, (function (callback) {
		ERASED = true
		callback()
	}).bind(undefined, callback))
}

function play_svg (svg, delay, callback) {
	// prepare
	var groups = svg.children
	for (var g = 0, lg = groups.length; g < lg; g++) {
		var elements = groups[g].tagName==='g' ? groups[g].children : [groups[g]]
		for (var e = 0, le = elements.length; e < le; e++) {
			if(elements[e].tagName==='text')
				continue
			prepare_drawing_element(elements[e])
		}
	}

	// launch
	var total_duration = delay || 0
	for (var g = 0, lg = groups.length; g < lg; g++) {
		total_duration += .5
		var elements = groups[g].tagName==='g' ? groups[g].children : [groups[g]]
		for (var e = 0, le = elements.length; e < le; e++) {
			if(elements[e].tagName==='text')
				continue
			if(elements[e].getAttribute('data-type')!=='erase'){
				total_duration += start_drawing_element (elements[e], total_duration)
			}
		}
	}

	if (callback)
		setTimeout(callback, total_duration*1000)

	return total_duration
}

function interrupt_drawing_element_svg (svg) {
	var groups = svg.children
	for (var g = 0, lg = groups.length; g < lg; g++) {
		var elements = groups[g].tagName==='g' ? groups[g].children : [groups[g]]
		for (var e = 0, le = elements.length; e < le; e++) {
			var computedStyle = window.getComputedStyle(elements[e])
			elements[e].style.strokeDasharray = computedStyle.getPropertyValue('stroke-dasharray')
			elements[e].style.strokeDashoffset = computedStyle.getPropertyValue('stroke-dashoffset')
			elements[e].style.transition = 'none'
		}
	}
}

function force_finish_drawing_element_svg (svg) {
	var groups = svg.children
	for (var g = 0, lg = groups.length; g < lg; g++) {
		var elements = groups[g].tagName==='g' ? groups[g].children : [groups[g]]
		for (var e = 0, le = elements.length; e < le; e++) {
			if(elements[e].getAttribute('data-type')==='erase'){
				elements[e].style.strokeDashoffset = elements[e].getTotalLength()
			}
			elements[e].style.transition = 'none'
		}
	}
}

function prepare_drawing_element (element) {
  var length = element.getTotalLength()
	element.style.strokeDasharray = length + ' ' + length
	element.style.strokeDashoffset = length
}

function start_drawing_element (element, delay, callback) {
	var length = element.getTotalLength()

  if(element.getAttribute('data-type')==='writing' || !element.getAttribute('stroke')){
    var speed_power = .25
    var smoothing = 'ease-out'
  } else if (element.getAttribute('data-type')==='erase'){
    var speed_power = .4
    var smoothing = 'linear'
  } else {
    var speed_power = .6
    var smoothing = 'ease-in-out'
  }

	var duration = .1/SPEED*Math.pow(length, speed_power)

	element.getBoundingClientRect()
	element.style.transition = 'stroke-dashoffset ' + duration + 's ' + smoothing + ' ' + delay + 's'
	element.style.strokeDashoffset = '0'
	element.style.visibility = 'visible'

	if (callback)
		setTimeout(callback, (delay+duration)*1000)

  return duration
}
