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


/////////////
// GLOBALS //
/////////////

// STATE, SETTINGS, POLYFILLS, ...
var ANIMATE = localStorage.getItem('animate')===null ? document.getElementById('animation_check').checked : localStorage.getItem('animate')
var SPEED = localStorage.getItem('speed') || 4
var SIZE_FACTOR = 1.4
var ERASED
var SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
var DOMURL = self.URL || self.webkitURL || self

// DOM
var ASIDE = document.getElementsByTagName('aside')[0]
var MAIN = document.getElementsByTagName('main')[0]
var SECTION = document.getElementsByTagName('section')[0]
var AS = SECTION.getElementsByTagName('a')

// GRID LAYOUT
var recorded_section_height = SECTION.getBoundingClientRect().height
var remember_scroll = 0

// STICKY ASIDE
var scrolled, old_scrollY = 0

//////////
// INIT //
//////////

// COMPUTE & APPLY data from localStorage
if(ANIMATE==='false') ANIMATE = false
if(ANIMATE==='true') ANIMATE = true
document.getElementById('animation_check').checked = ANIMATE
document.getElementById('speed_input').value = SPEED

// EXTRACT SVG DATA FROM DOM (it starts in the DOM for SEO purposes)
if(ARCHIVES){
  for (var i = 0; i < AS.length; i++) {
    GRAPHS[i].content = AS[i].firstElementChild.removeChild(AS[i].firstElementChild.firstElementChild)
  }
} else {
  GRAPHS[INDEX].content = MAIN.replaceChild(document.createElement('svg'), MAIN.firstElementChild)
}

// ATTACH LISTENERS
for (var i = 0; i < AS.length; i++) { AS[i].addEventListener('click', navigate.bind(undefined, i)) }
document.getElementById('logo').parentElement.addEventListener('click', navigate.bind(undefined, 0))
ASIDE.getElementsByTagName('h2')[0].parentElement.addEventListener('click', navigate.bind(undefined, 0))
document.getElementById('prev').addEventListener('click', function(event) { if(this.classList.contains('disabled')) { event.stopPropagation(); event.preventDefault(); return} navigate('prev', event) } )
document.getElementById('next').addEventListener('click', function(event) { if(this.classList.contains('disabled')) { event.stopPropagation(); event.preventDefault(); return} navigate('next', event) } )
document.getElementById('cog').addEventListener('click', function (event) { if(ARCHIVES){event.stopPropagation();event.preventDefault();return} } )
document.getElementById('archives').addEventListener('click', function (event) { if(ARCHIVES){event.stopPropagation(); event.preventDefault(); scrollTo(0,0)} navigate('archives', event) } )
document.getElementById('speed_input').addEventListener('change', function (event) { SPEED = this.value; localStorage.setItem('speed', this.value) })
window.addEventListener('resize', function () { properly_size_svg() })
window.addEventListener('scroll', function (event) { scrolled = true })
window.requestAnimationFrame(sticky_aside)

document.getElementById('animation_check').addEventListener('change', function (event) {
	ANIMATE = this.checked
	localStorage.setItem('animate', this.checked)
	var svg = MAIN.getElementsByTagName('svg')[0]
	if(ANIMATE)
		play_svg(svg, 0)
	else
		force_finish_drawing_element_svg(svg)
})

window.addEventListener('keydown', function (event) {
  if(event.repeat) return
  if(event.keyCode===37 || event.keyCode===38)
    navigate('prev', event)
  if(event.keyCode===39 || event.keyCode===40)
    navigate('next', event)
})

window.onpopstate = function (event) {
	if(!event.state) // invalid
		return

    console.log('new state poped: name='+event.state.name)

  if(event.state.name==='archives') // archives
		return setup_archives()

	var index = -1
	if(event.state.name)
		index = find_needle_with_key(event.state.name, 'name')
  setup_graph(index===-1?0:index)
}





if(ARCHIVES)
  setup_archives()
else
  setup_graph()

function setup_graph (index) {
  var index = index || 0
  console.log('setting up graph #'+index)

  if(ARCHIVES){
    console.log('graph setup from ARCHIVES mode')

    ASIDE.className = ''
    document.getElementById('cog').className = ''

    // remember stuff before applying style
		var aside_rect = ASIDE.getBoundingClientRect()
		remember_scroll = window.scrollY

    // fix section
		SECTION.style.top = (-window.scrollY)+'px'

		// apply
		AS[index].className = 'expanded'
		AS[index].parentNode.className = 'expanded'

		// position ::before
		var rect = AS[index].getBoundingClientRect()
		position_main_slide(rect)

		// keep aside in place
		document.getElementById('dummy_section').style.height = ASIDE.getBoundingClientRect().height+'px'
		if(ASIDE.getAttribute('data-stuck')==='fixed-top')
			window.scrollTo(0,0)

    then(index)
  } else {
    console.log('graph setup from GRAPHS mode')
    // simulaneously LOAD next svg and ERASE current one
    var erased, loaded
    var svg = MAIN.getElementsByTagName('svg')
    if(svg){
      svg = svg[0]
      interrupt_drawing_element_svg(svg)
      erase(svg, 0, (function (index) {
        MAIN.removeChild(this)
        erased = true
        if(loaded)
          then(index)
      }).bind(svg, index))
    } else {
      erased = true
    }
    load_svg(index, function(index){
      loaded = true
      if(erased)
        then(index)
    })
  }

  function then(index) {
    console.log('graph setup, second part')
    MAIN.innerHTML = ''
    var svg = GRAPHS[index].content.cloneNode(true)
    MAIN.appendChild(svg)
    MAIN.setAttribute('data-index', index)

    // authorship
  	if(GRAPHS[index].author){
      var span = document.createElement('span')
      span.setAttribute('id', 'authorship')
      span.innerHTML = GRAPHS[index].credit + ' '
      var a = document.createElement('a')
      a.className = 'credits'
      a.setAttribute('href', GRAPHS[index].source)
      a.setAttribute('target', '_blank')
      a.innerHTML = GRAPHS[index].author
      span.appendChild(a)
  		MAIN.appendChild(span)
    }

    // release date
    var date_obj = new Date(GRAPHS[index].release[1] + ' / ' + GRAPHS[index].release[2] + ' / ' + GRAPHS[index].release[0])
    var pubdate = document.createElement('span')
    pubdate.id = 'pubdate'
    pubdate.innerHTML = 'published on ' + date_obj.getLitteralMonth() + ' ' + parseInt(GRAPHS[index].release[2]) + date_obj.getDatePostfix() + ', ' + GRAPHS[index].release[0]
    MAIN.appendChild(pubdate)

    // png
    if(GRAPHS.watermark_is_loaded)
      put_overlay_image(GRAPHS[index].watermark)
    else if (GRAPHS[index].urldata)
      put_overlay_image(GRAPHS[index].urldata, index)
    else
      svg_to_png(GRAPHS[index].content, set_img.bind(undefined, index))

    // misc
    rewrite_url(GRAPHS[index].name)
    update_page_title(GRAPHS[index].formatted_name)
    update_link_state(index)
  	properly_size_svg(svg)
  	update_logo_colors()

    // animate svg
    prepare_drawing_element_svg(svg)
  	var total_duration = play_svg(svg, .5)
  	if(!ANIMATE)
  		force_finish_drawing_element_svg(svg)

    // FLAGS
    ARCHIVES = false
    INDEX = index

    // preload
    if(GRAPHS[INDEX+1])
      load_svg(INDEX+1)
  }
}

function setup_archives (from_index) {
  console.log('setting up archives: index='+from_index)
  var from_index = from_index || 0

  rewrite_url('archives')
  update_page_title('Archives')

  // LOAD SVGS
  for (var index = 0, l = AS.length; index < l; index++) {
    if(!GRAPHS[index].is_processed)
      load_svg(index, then)
    else
      then(index)
  }
  function then(index){
    force_finish_drawing_element_svg(MAIN.getElementsByTagName('svg')[0])
  }

  // LAYOUT
  // apply styles to aside
  ASIDE.className = 'archives'
  document.getElementById('cog').className = 'disabled'
  // unfix section
  SECTION.style.top = 0
  // apply styles to section
  var expanded_a = SECTION.querySelector('a.expanded')
  if(expanded_a){
    expanded_a.className = 'unexpanded'
    expanded_a.parentNode.className = ''
    setTimeout((function (el) { if(el.className==='unexpanded') el.className = '' }).bind(undefined, expanded_a), 1000)
  }
  // replace old scroll, keep aside in place
  var aside_rect = ASIDE.getBoundingClientRect()
  document.getElementById('dummy_section').style.height = recorded_section_height+'px'
  window.scrollTo(0,remember_scroll)
  place_aside('absolute-bottom', window.scrollY+aside_rect.top>0 ? aside_rect.top : 0)

  // FLAGS
  ARCHIVES = true
}

function navigate (direction, event) {
	event.stopPropagation()
	event.preventDefault()

  console.log('navigate to '+direction)

  var svg = MAIN.getElementsByTagName('svg')[0]
  if(!ARCHIVES && svg)
    interrupt_drawing_element_svg(svg)

  if(direction==='archives') // to archives
		return setup_archives(INDEX)
  if(typeof direction === 'number') // to specific graph
    return setup_graph(direction)
  if(direction==='prev' && GRAPHS[INDEX-1]) // to previous graph
    return setup_graph(INDEX-1)
  if(direction==='next' && GRAPHS[INDEX+1]) // to previous graph
    return setup_graph(INDEX+1)

  console.log('wrong navigation instructions')
}


function place_aside(position, top){
  switch (position) {
    case 'absolute-top':
      ASIDE.setAttribute('data-stuck', 'absolute-top')
      ASIDE.style.top = window.scrollY+'px'
      ASIDE.style.bottom = 'auto'
      ASIDE.style.position = 'absolute'
      break;
    case 'fixed-bottom':
      ASIDE.setAttribute('data-stuck', 'fixed-bottom')
      ASIDE.style.top = 'auto'
      ASIDE.style.bottom = 0
      ASIDE.style.position = 'fixed'
      break;
    case 'absolute-bottom':
      ASIDE.setAttribute('data-stuck', 'absolute-bottom')
      ASIDE.style.top = (window.scrollY+top)+'px'
      ASIDE.style.bottom = 'auto'
      ASIDE.style.position = 'absolute'
      break
    case 'fixed-top':
      ASIDE.setAttribute('data-stuck', 'fixed-top')
      ASIDE.style.top = 0
      ASIDE.style.bottom = 'auto'
      ASIDE.style.position = 'fixed'
      break;
  }
}

function sticky_aside() {
  if(scrolled){
    var diff = window.scrollY - old_scrollY
    var aside_rect = ASIDE.getBoundingClientRect()
    if(diff>0){
      if(ASIDE.getAttribute('data-stuck')==='fixed-top'){
        place_aside('absolute-top')
      } else if(aside_rect.bottom <= window.innerHeight){
        place_aside('fixed-bottom')
      }
    } else if (diff<0){
      if(ASIDE.getAttribute('data-stuck')==='fixed-bottom'){
        place_aside('absolute-bottom', aside_rect.top)
      } else if(aside_rect.top >= 0){
        place_aside('fixed-top')
      }
    }
    scrolled = false
    old_scrollY = window.scrollY
  }
  window.requestAnimationFrame(sticky_aside)
}

//////////////////////////////////
// TWEAKS NEEDED ON PAGE CHANGE //
//////////////////////////////////
// includes styling, updating links, url rewriting, title update

function position_main_slide(ref_rect){
  var sheet = document.styleSheets[0]
  var rules = sheet.cssRules || sheet.rules
  rules[0].style.top = 'calc('+(-ref_rect.top)+'px + 1rem)'
  rules[0].style.left = 'calc('+(-ref_rect.left)+'px + 30vw)'
}

function update_logo_colors () {
  var arrow = document.querySelectorAll('#logo path[stroke]:not([stroke="#000000"]), #logo polyline[stroke]:not([stroke="#000000"])')
  var color = MAIN.querySelector('svg path[stroke], svg polyline[stroke]').getAttribute('stroke')
  for (var i = 0, l = arrow.length; i < l; i++) {
    arrow[i].style.stroke = color
  }
}

function update_link_state (index) {
	var prev = document.getElementById('prev')
  if(index===0) {
  	prev.classList.add('disabled')
  	prev.setAttribute('href', '#')
  } else {
		prev.classList.remove('disabled')
		prev.setAttribute('href', '/'+GRAPHS[index-1].name)
	}

	var next = document.getElementById('next')
  if(index===GRAPHS.length-1) {
  	next.classList.add('disabled')
  	next.setAttribute('href', '#')
  } else {
		next.classList.remove('disabled')
		next.setAttribute('href', '/'+GRAPHS[index+1].name)
	}
}

function rewrite_url(name) {
  if(history.state && history.state.name === name)
    window.history.replaceState({name: name}, "", name)
  else
    window.history.pushState({name: name}, "", name)
}

function update_page_title (title) {
  document.title = 'Whiteboard Comics' + (title ? ' — ' + title : '')
}


///////////////////////////
// AJAX & PRE-PROCESSING //
///////////////////////////

function load_svg (index, callback, increment) {
	if(GRAPHS[index] && GRAPHS[index].content)
		return preprocess_svg(index, callback)

  console.log('loading graph #'+index)

  var increment = typeof increment === 'undefined' ? 0 : increment

  var httpRequest = new XMLHttpRequest()
	httpRequest.onreadystatechange = loaded_svg.bind(undefined, index, httpRequest, callback, increment)
	httpRequest.open('GET', GRAPHS[index].path)
	httpRequest.send()

  function loaded_svg (index, httpRequest, callback, increment) {
  	if (httpRequest.readyState === XMLHttpRequest.DONE) {
  		if (httpRequest.status === 200) {
        var temp_div = document.createElement('div')
        temp_div.innerHTML = httpRequest.responseText
  			GRAPHS[index].content = temp_div.firstElementChild
  			preprocess_svg(index, callback)
  		} else {
        if(increment < 10)
  			  setTimeout(load_svg.bind(undefined, index, callback, increment+1), 1000)
        else{
          console.log('couldnt load graph '+index+' after 10 trials, giving up.')
          if(callback) callback(false)
        }
  		}
  	}
  }

  function preprocess_svg (index, callback) {
    if(!GRAPHS[index].is_processed){
      console.log('preprocessing graph #'+index)
      var erase = GRAPHS[index].content.removeChild(GRAPHS[index].content.getElementsByTagName('path')[0])
      erase.setAttribute('data-type', 'erase')
      erase.setAttribute('stroke', 'transparent')
      GRAPHS[index].content.appendChild(erase)
      GRAPHS[index].content = rewrite_with_paths(GRAPHS[index].content)
      GRAPHS[index].is_processed = true
      AS[index].firstElementChild.appendChild(GRAPHS[index].content)
      properly_size_svg(GRAPHS[index].content)
    }
    if(callback) callback(index)
  }
}

function properly_size_svg (svg) {
	// uniformly size svg (this assumes a viewbox < 1000x1000 when SIZE_FACTOR is set to 1)
	if(svg)
		return action(svg)

	var svgs = SECTION.querySelectorAll('svg')
	for (var i = 0, l = svgs.length; i < l; i++) {
	  action(svgs[i])
	}

	function action (svg) {
		if(!svg || !svg.getAttribute || !svg.getAttribute('viewBox'))
			return
		var viewbox = svg.getAttribute('viewBox').split(' ')
		var parent = svg.parentElement.getBoundingClientRect()

    if(parent.width < parent.height)
      svg.style.width = (SIZE_FACTOR * viewbox[2]/10) + '%'
    else
      svg.style.height = (SIZE_FACTOR * viewbox[3]/10) + '%'
	}
}


////////////////////////
// SVG TO PNG LIBRARY //
////////////////////////

function set_img (index, data){
  if(!GRAPHS[index].urldata){
    GRAPHS[index].urldata = data
    var is_new = true
  }
  var img = put_overlay_image(data, index)
  if(is_new)
    save_img_to_server(img, index)
}
function put_overlay_image(url, index){
  var img = document.getElementById('overlay')
  if(!img){
    img = new Image()
    img.setAttribute('id', 'overlay')
    var svg_rect = MAIN.getElementsByTagName('svg')[0].getBoundingClientRect()
    img.height = svg_rect.height
    img.width = svg_rect.width
    img.setAttribute('alt',GRAPHS[index||INDEX].name+'.png')
    MAIN.appendChild(img)
  }
  img.src = url
  return img
}
function save_img_to_server (img, index) {
  var params = "dataURL=" + encodeURIComponent(img.src)
  var request = new XMLHttpRequest();
  request.open("POST", "/save_img.php?name="+GRAPHS[index].name, true);
  request.setRequestHeader("Content-type","application/x-www-form-urlencoded")
  request.onreadystatechange = (function (img) {
    if (request.readyState === 4 && request.status === 200){
      GRAPHS[index].watermarked = request.responseText
      var temp_img = new Image()
      temp_img.onload = (function (img, temp_img) {
        GRAPHS[index].watermark_is_loaded = true
        img.src = temp_img.src
      }).bind(undefined, img, temp_img)
      temp_img.src = request.responseText
    }
  }).bind(undefined, img)
  request.send(params)
}
function svg_to_png (svg, callback) {
  // clone
  var clone_svg = svg.cloneNode(true)
  force_finish_drawing_element_svg(clone_svg)

  // style // debug, this should come from .css or from getComputedStyle
  clone_svg.style.backgroundColor = 'white';
  var el = clone_svg.querySelectorAll('path, line, polyline')
  for (var i = 0; i < el.length; i++) {
    el[i].style.fill = 'none'
    el[i].style.strokeLinecap = 'round'
  	el[i].style.strokeLinejoin = 'round'
  	el[i].style.strokeMiterlimit = 10
  }
  var el = clone_svg.querySelectorAll('path:not([stroke]), line:not([stroke]), polyline:not([stroke])')
  for (var i = 0; i < el.length; i++) {
    el[i].style.stroke = 'black'
  }
  var el = clone_svg.querySelectorAll('path:not([stroke-width]), line:not([stroke-width]), polyline:not([stroke-width])')
  for (var i = 0; i < el.length; i++) {
    el[i].style.strokeWidth = 4;
  }

  // add watermark on bottom left
  var text = document.createElementNS(SVG_NAMESPACE, 'text')
  text.innerHTML = 'whiteboard-comics.com' + (GRAPHS[INDEX].author ? (' & ' + GRAPHS[INDEX].author) : '')
  text.setAttribute('id', 'watermark')
  text.style.fontFamily = "'Droid Serif', Georgia, serif"
  text.style.opacity = .8
  clone_svg.appendChild(text)
  var viewbox = clone_svg.getAttribute('viewBox').split(' ')
  viewbox[3] = parseFloat(viewbox[3])+20
  text.setAttribute('transform', 'translate(5,'+(viewbox[3]-5)+')')
  clone_svg.setAttribute('viewBox', viewbox.join(' '))

  // create SVG => XML => BLOB url => canvas => data => png
  var svgString = new XMLSerializer().serializeToString(clone_svg)
  var dimensions = {
    width: 800,
    height: 800/viewbox[2]*viewbox[3]
  }
  var img = new Image()
  var svg_blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'})
  var url = DOMURL.createObjectURL(svg_blob)
  img.onload = (function(img, dimensions, callback) {
    var canvas = document.createElement('canvas')
    canvas.setAttribute('width', dimensions.width)
    canvas.setAttribute('height', dimensions.height)
    var ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
    var png = ctx.canvas.toDataURL('image/png')
    callback(png)
    DOMURL.revokeObjectURL(png)
  }).bind(undefined, img, dimensions, callback)
  img.src = url
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
			var el = document.createElementNS(SVG_NAMESPACE, 'g')
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
    letter = letter.toLowerCase()
    letter = letter.replace(/‘/g,"'").replace(/’/g,"'").replace(/“/g,'"').replace(/”/g,'"')
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
  console.log('playing MAIN svg')
	// prepare
  prepare_drawing_element_svg(svg)

	// launch
	var total_duration = delay || 0
  iterate_group(svg, function (element) {
    if(['g', 'line', 'polyline', 'path'].indexOf(element.tagName.toLowerCase())===-1)
      return
    if(element.getAttribute('data-type')!=='erase'){
      total_duration += start_drawing_element (element, total_duration)
    }
  }, function () {
    total_duration += .5
  })

	if (callback)
		setTimeout(callback, total_duration*1000)

	return total_duration
}

function interrupt_drawing_element_svg (svg) {
  iterate_group(svg, function (element) {
    if(['g', 'line', 'polyline', 'path'].indexOf(element.tagName.toLowerCase())===-1)
      return
    var computedStyle = window.getComputedStyle(element)
    element.style.strokeDasharray = computedStyle.getPropertyValue('stroke-dasharray')
    element.style.strokeDashoffset = computedStyle.getPropertyValue('stroke-dashoffset')
    element.style.transition = 'none'
  })
}

function force_finish_drawing_element_svg (svg) {
  iterate_group(svg, function (element) {
    if(['g', 'line', 'polyline', 'path'].indexOf(element.tagName.toLowerCase())===-1)
      return
    if(element.getAttribute('data-type')==='erase'){
      element.style.strokeDashoffset = element.getTotalLength()
    } else {
      element.style.strokeDashoffset = '0'
    }
    element.style.transition = 'none'
  })
}

function prepare_drawing_element_svg (svg) {
  iterate_group(svg, function (element) {
    if(['g', 'line', 'polyline', 'path'].indexOf(element.tagName.toLowerCase())===-1)
      return
    prepare_drawing_element(element)
  })
}

function iterate_group(parent, element_call, depth_call) {
  var elements = parent.children
  for (var e = 0, le = elements.length; e < le; e++) {
    if(elements[e].tagName.toLowerCase()==='g'){
      if(depth_call) depth_call()
      iterate_group(elements[e], element_call, depth_call)
    } else {
      element_call(elements[e])
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
