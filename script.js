/////////////////////////
// ERROR LOG TO SERVER //
/////////////////////////

SEND_LOG = false
SEND_WARNING = true

server_and_console = {
  warn: function (message) {
    if(LOGGING) console.warn(message)
    if(SEND_WARNING){
      log({
        type: 'warning',
        log: message
      })
      SEND_LOG = true
    }
    this.full_log.push('WARNING: '+message)
  },
  log: function (message) {
    if(LOGGING) console.log(message)
    this.full_log.push(message)
  },
  full_log: [],
  navigation: []
}

window.onerror = function(event) {
  log({
    type: 'error',
    log: event
  })
  server_and_console.full_log.push('ERROR: '+event)
  SEND_LOG = true
  return true
}

window.onbeforeunload = function(event) {
  if(SEND_LOG && server_and_console.full_log.length!==0)
    log({
      type: 'log',
      history: server_and_console.navigation,
      log: server_and_console.full_log
    })
}

var sessionTS = Date.now()
function log (message) {
  var report = {
    message: message,
    navigator: {
      name: navigator.appName,
      vendor: navigator.vendor,
      version: navigator.appVersion,
      codename: navigator.appCodeName,
      platform: navigator.platform
    },
    window: {
      width: window.screen.width,
      height: window.screen.height,
      maxwidth: window.screen.availWidth,
      maxheight: window.screen.availHeight
    }
  }

  var request = new XMLHttpRequest()
  request.open('POST', '/error_log.php?ts='+sessionTS, true)
  request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
  request.onreadystatechange = (function (request) {
    if (request.readyState === 4 && request.status !== 200){
      if(LOGGING) console.warn('couldnt send error report to server')
    }
  }).bind(undefined, request)
  request.send(JSON.stringify(report))
}


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

CSSStyleSheet.prototype.setRule = function (selector, rule) {
  var rules = this.cssRules || this.rules
  for (var i = 0, l = rules.length; i < l; i++) {
    if(rules[i].selectorText.toLowerCase()===selector.toLowerCase()){
      server_and_console.log('complementing existing rule for "'+selector+'"')
      for (var attribute in rule) {
        if(rule.hasOwnProperty(attribute)){
          rules[i].style[toCssAttribute(attribute)] = rule[attribute]
        }
      }
      break
    }
  }
  if(i===l){
    server_and_console.log('creating new rule for "'+selector+'"')
    var str_rule = ''
    for (var attribute in rule) {
      if(rule.hasOwnProperty(attribute)){
        str_rule += toCssAttribute(attribute)+':'+rule[attribute]+';'
      }
    }
    this.insertRule(selector + '{'+str_rule+'}', rules.length)
  }
  function toCssAttribute(attribute) {
    return attribute.replace(/[A-Z]/, '-$&', 'g').toLowerCase()
  }
}

function getUnitInPixels (unit) {
  var div = document.createElement('div')
  div.style.height = '1'+unit
  div.style.visibility = 'hidden'
  div.style.position = 'fixed'
  document.body.appendChild(div)
  var height = div.getBoundingClientRect().height
  document.body.removeChild(div)
  return height
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
ANIMATE = localStorage.getItem('animate')===null ? document.getElementById('animation_check').checked : localStorage.getItem('animate')
SPEED = localStorage.getItem('speed') || 5
SIZE_FACTOR = 1.4
SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
DOMURL = self.URL || self.webkitURL || self
MAX_SIMULTANEOUS_SVG_REQUESTS = 4
LOGGING = false
FONT_LOADED = false
FIRST_LANDING = true

// DOM
ASIDE = document.getElementsByTagName('aside')[0]
MAIN = document.getElementsByTagName('main')[0]
SECTION = document.getElementsByTagName('section')[0]
AS = SECTION.getElementsByTagName('a')
TAGS_CHECK = document.getElementById('tags').getElementsByTagName('input')

// STYLE
var REM = getUnitInPixels('rem')
var SHEET = document.createElement('style'); SHEET.type = 'text/css'; document.getElementsByTagName('head')[0].appendChild(SHEET); SHEET = SHEET.styleSheet || SHEET.sheet

// LOGO
LOGO_ARROW_PATH = document.getElementById('arrowpath')
LOGO_ARROW_HEAD = document.getElementById('arrowhead')
var logo_full_path_length = LOGO_ARROW_PATH.getTotalLength()
var logo_body_length = 157.75
LOGO_ARROW_PATH.style.strokeDasharray = logo_body_length + ' ' + logo_body_length*3

// STICKY ASIDE
var remember_scroll = 0
var scrolled, old_scrollY = 0
var cached_inner_height = window.innerHeight
var cached_inner_width = window.innerWidth
var base_height_on_aside = true
var aside_rect, section_rect

// LOADING AS BASED ON SCROLL
var loading_as = {}
for (var i = 0, l = AS.length; i < l; i++) { loading_as[i] = {requested: false} }


//////////
// INIT //
//////////

// LOAD FONTS
WebFontConfig = {
  google: { families: [ 'Droid+Serif::latin', 'Permanent+Marker::latin' ] },
  fontactive: function(familyName) {
    if(familyName==='Droid Serif'){
      resize_el_height(document.getElementById('blurb'), !ARCHIVES)
      resize_el_height(document.getElementById('tags'), ARCHIVES)
      sizes_have_changed(false, true)
    } else if (familyName==='Permanent Marker') {
      FONT_LOADED = true
      if(FIRST_LANDING)
        intermediateprocess_svg(currently_loading_index)
      else for (var i = 0, l = GRAPHS.length; i < l; i++) {
        if(GRAPHS[i].is_processed){
          server_and_console.log('graph #'+i+' being reprocessed after font load')
          var old_writing = GRAPHS[i].content.querySelectorAll('[data-type=writing]')
          for (var j = 0, k = old_writing.length; j < k; j++) {
            old_writing[j].parentElement.removeChild(old_writing[j])
          }
          try_to_rewrite_with_paths(GRAPHS[i], true)
        }
      }
    }
  },
}

var wf = document.createElement('script')
wf.src = 'http://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js'
wf.type = 'text/javascript'
wf.async = 'true'
var s = document.getElementsByTagName('script')[0]
s.parentNode.insertBefore(wf, s)

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
  GRAPHS[INDEX].content = MAIN.removeChild(MAIN.firstElementChild)
}

// ATTACH LISTENERS
function add_all_event_listeners () {
  for (var i = 0; i < AS.length; i++) { AS[i].addEventListener('click', navigate.bind(undefined, i)) }
  document.getElementById('home').addEventListener('click', navigate.bind(undefined, 0))
  document.getElementById('prev').addEventListener('click', function(event) { if(this.classList.contains('disabled')) { event.stopPropagation(); event.preventDefault(); return} navigate('prev', event) } )
  document.getElementById('next').addEventListener('click', function(event) { if(this.classList.contains('disabled')) { event.stopPropagation(); event.preventDefault(); return} navigate('next', event) } )
  document.getElementById('cog').addEventListener('click', function (event) { if(ARCHIVES){event.stopPropagation();event.preventDefault();return} } )
  document.getElementById('archives').addEventListener('click', function (event) { if(ARCHIVES){event.stopPropagation(); event.preventDefault();} navigate('archives', event) } )
  document.getElementById('speed_input').addEventListener('change', function (event) { SPEED = this.value; localStorage.setItem('speed', this.value) })
  window.addEventListener('scroll', function (event) {
    which_vignette_should_load()
    scrolled = true
  })
  window.requestAnimationFrame(sticky_aside)
  for (var i = 0; i < TAGS_CHECK.length; i++) { TAGS_CHECK[i].addEventListener('change', filter) }

  window.addEventListener('resize', function () {
    cached_inner_height = window.innerHeight
    cached_inner_width = window.innerWidth
    resize_el_height(document.getElementById('blurb'), !ARCHIVES)
    resize_el_height(document.getElementById('tags'), ARCHIVES)
    // properly_size_svg()
    which_vignette_should_load()
    sizes_have_changed(false, true)
  })

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

    server_and_console.log('new state poped: name='+event.state.name)
    logo_start_moving()

    if(event.state.name==='archives') // archives
      return setup_archives(INDEX)

    var index = -1
    if(event.state.name)
      index = find_needle_with_key(event.state.name, 'name')
    setup_graph(index===-1?0:index)
  }
}




////////////
// SCRIPT //
////////////

add_all_event_listeners()
server_and_console.log('Entering site @ '+window.location.pathname);
if(ARCHIVES)
  setup_archives()
else{
  resize_el_height(document.getElementById('blurb'), !ARCHIVES)
  resize_el_height(document.getElementById('tags'), ARCHIVES)
  var recovered_index = -1;
  if(history.state && history.state.name)
    recovered_index = find_needle_with_key(history.state.name, 'name')
  if(recovered_index !== -1){
    server_and_console.log('state recovered from history: asking for graph #' + recovered_index + ': @ ' + GRAPHS[recovered_index].name)
    setup_graph(recovered_index)
  } else {
    server_and_console.log('creating history state: asking for graph #' + INDEX + ': @ ' + GRAPHS[INDEX].name)
    window.history.replaceState({name: GRAPHS[INDEX].name}, "", GRAPHS[INDEX].name)
    setup_graph(INDEX)
  }
}

var currently_loading_index
function setup_graph (index) {
  var index = index || 0
  if(!ARCHIVES && index === currently_loading_index){
    server_and_console.warn('will not setup graph: asking for #'+index+' ('+GRAPHS[index].formatted_name+') and already loading/showing #'+currently_loading_index+' ('+GRAPHS[currently_loading_index].formatted_name+') (INDEX is #'+INDEX+': '+GRAPHS[INDEX].formatted_name+')');
    return
  }
  if (typeof currently_loading_index !== 'undefined')
    logo_start_moving()
  currently_loading_index = index
  server_and_console.log('setting up graph #'+index)
  server_and_console.navigation.push(GRAPHS[index].name)

  if(ARCHIVES){
    server_and_console.log('graph setup from ARCHIVES mode')

    // remember stuff before applying style
		remember_scroll = window.scrollY

    ASIDE.className = ''
    document.getElementById('cog').className = ''

    // fix section
		SECTION.style.top = (-window.scrollY)+'px'

		// apply
		AS[index].className = 'expanded'
		AS[index].parentNode.className = 'expanded'

		// position ::before
		var as_rect = AS[index].getBoundingClientRect()
		position_main_slide(as_rect)

		// keep aside in place
    ARCHIVES = false
    resize_el_height(document.getElementById('blurb'), !ARCHIVES)
    resize_el_height(document.getElementById('tags'), ARCHIVES)
    sizes_have_changed(true, true)

    load_svg(index, function(index){
      if(currently_loading_index!==index)
        return
      update_logo_colors(index)
      rewrite_url(GRAPHS[index].name)
      update_page_title(GRAPHS[index].formatted_name)
      server_and_console.log('graph #'+index+' loaded (coming back from ARCHIVES)');
      then(index)
    })
  } else {
    server_and_console.log('graph setup from GRAPHS mode')

    // switch vignette in background
    SECTION.classList.add('noanimation')
    // SECTION.querySelector('a.expanded').className = '' // TODO: does this solve the problem of having an expanded vignette div in the background when clicking repeatdly on Next or Prev ?
    AS[INDEX].className = ''
    AS[index].className = 'expanded'
    var as_rect = AS[index].getBoundingClientRect()
		position_main_slide(as_rect)

    // simulaneously LOAD next svg and ERASE current one
    var erased, loaded
    var svg = MAIN.getElementsByTagName('svg')[0]
    if(svg){
      interrupt_drawing_element_svg(svg)
      erase(svg, 0, (function (index) {
        // MAIN.removeChild(this)
        erased = true
        server_and_console.log('cloned graph #'+INDEX+' erased');
        if(loaded)
          then(index)
      }).bind(svg, index))
    } else {
      server_and_console.log('no svg found, considering svg already erased');
      erased = true
    }

    load_svg(index, (function (index) {
      if(currently_loading_index!==index)
        return
      loaded = true
      update_logo_colors(index)
      rewrite_url(GRAPHS[index].name)
      update_page_title(GRAPHS[index].formatted_name)
      server_and_console.log('graph #'+index+' loaded');
      if(erased)
        then(index)
    }).bind(undefined, index))
  }

  function then(index) {
    if(currently_loading_index!==index)
      return
    server_and_console.log('cloning #'+index+' processed '+(GRAPHS[index].nofont?'without':'with')+' font')
    MAIN.innerHTML = ''
    MAIN.setAttribute('data-index', index)

    // animate svg
    var svg = GRAPHS[index].content.cloneNode(true)
    MAIN.appendChild(svg)
    prepare_drawing_element_svg(svg)
    var total_duration = play_svg(svg, .5)
    if(!ANIMATE)
      force_finish_drawing_element_svg(svg)

    // authorship
  	if(GRAPHS[index].author){
      var span = document.createElement('span')
      span.setAttribute('id', 'authorship')
      span.textContent = GRAPHS[index].credit + ' '
      var a = document.createElement('a')
      a.className = 'credits'
      a.setAttribute('href', GRAPHS[index].source)
      a.setAttribute('target', '_blank')
      a.textContent = GRAPHS[index].author
      span.appendChild(a)
		  MAIN.appendChild(span)
    }

    // release date
    var date_obj = new Date(GRAPHS[index].release[1] + ' / ' + GRAPHS[index].release[2] + ' / ' + GRAPHS[index].release[0])
    var pubdate = document.createElement('span')
    pubdate.id = 'pubdate'
    pubdate.textContent = 'published on ' + date_obj.getLitteralMonth() + ' ' + parseInt(GRAPHS[index].release[2]) + date_obj.getDatePostfix() + ', ' + GRAPHS[index].release[0]
    MAIN.appendChild(pubdate)

    // png
    if(GRAPHS[index].watermark_is_loaded)
      put_overlay_image(index, GRAPHS[index].watermarked)
    else if (GRAPHS[index].urldata)
      set_img_from_urldata(index, GRAPHS[index].urldata)
    else{
      var img = new Image()
      MAIN.appendChild(img)
      if(DOMURL.createObjectURL)
        svg_to_png(index, set_img_from_urldata.bind(undefined, index, img))
      else if(GRAPHS[index].watermarked)
        load_watermark_from_server(img, index)
      else
        server_and_console.warn('there isnt going to be an img overlay for this one: #'+index+' ('+GRAPHS[index].formatted_name+')')
    }

    // misc
    INDEX = index
  	// properly_size_svg(svg)
    update_link_state(index)
    currently_loading_index = false

    // preload
    if(GRAPHS[index+1] && !GRAPHS[index+1].is_processed)
      load_svg(index+1)
    else if(GRAPHS[index-1] && !GRAPHS[index-1].is_processed)
      load_svg(index-1)
  }
}

function setup_archives (from_index) {
  FIRST_LANDING = false
  if(currently_loading_index==='archives')
    return
  currently_loading_index = 'archives'
  var from_index = from_index || 0
  server_and_console.log('setting up archives from #'+from_index)
  server_and_console.navigation.push('ARCHIVES')

  if(!ARCHIVES)
    logo_start_moving()
  rewrite_url('archives')
  update_page_title('Archives')

  // LAYOUT
  // apply styles to aside
  ASIDE.className = 'archives'
  document.getElementById('cog').className = 'disabled'
  // unfix section
  SECTION.style.top = 0
  // apply styles to section
  var expanded_as = SECTION.querySelectorAll('a.expanded')
  if(expanded_as.length>0){
    expanded_as[0].parentNode.className = ''
    for (var i = 0, l = expanded_as.length; i < l; i++) {
      expanded_as[i].className = 'unexpanded'
      setTimeout((function (el) { if(el.className==='unexpanded') el.className = '' }).bind(undefined, expanded_as[i]), 1000)
    }
  }
  // replace old scroll, keep aside in place
  ARCHIVES = true
  resize_el_height(document.getElementById('blurb'), !ARCHIVES)
  resize_el_height(document.getElementById('tags'), ARCHIVES)
  sizes_have_changed(true, true)
  window.scrollTo(0,remember_scroll)

  // LOAD SVGS
  check_each_vignette_for_loading_position(true)
}

var which_vignette_should_load_id
function which_vignette_should_load () {
  if(!ARCHIVES)
    return
  if(which_vignette_should_load_id)
    window.cancelAnimationFrame(which_vignette_should_load_id)
  which_vignette_should_load_id = window.requestAnimationFrame(check_each_vignette_for_loading_position)
}
function check_each_vignette_for_loading_position(force){
  var margin = cached_inner_height / 2
  var loading_window = [
    window.scrollY - margin,
    window.scrollY + cached_inner_height + margin
  ]
  var vignette_load_count = 0
  for (var i = 0, l = AS.length; i < l; i++) {
    if(GRAPHS[i].is_processed || GRAPHS[i].being_loaded)
      delete loading_as[i]
    else if(loading_as[i] && !loading_as[i].hidden && !loading_as[i].requested && a_is_in_window(i, loading_window)){
      loading_as[i].requested = true
      if(force===true) {
        delete loading_as[i]
        load_svg(i)
      } else {
        setTimeout((function(index, margin){
          var loading_window = [
            window.scrollY - margin,
            window.scrollY + cached_inner_height + margin
          ]
          if(loading_as[index] && !loading_as[index].hidden && a_is_in_window(index, loading_window)){
            delete loading_as[index]
            load_svg(index)
          } else if(loading_as[index]){
            loading_as[index].requested = false
          }
        }).bind(undefined, i, margin), 300)
      }
    }
  }
}
function a_is_in_window (i, loading_window) {
  return (AS[i].offsetTop > loading_window[0] && AS[i].offsetTop < loading_window[1])
}

function filter (event){
  var selected = []

  // sort out tags themselves (which ones are checked, if none check "all", if "all" check none)
  var all_checked = this===TAGS_CHECK[0]
  for (var i = 1; i < TAGS_CHECK.length; i++) {
    if(!all_checked && TAGS_CHECK[i].checked)
      selected.push(i-1)
    else
      TAGS_CHECK[i].checked = false
  }
  if(selected.length===0)
    TAGS_CHECK[0].checked = true
  else
    TAGS_CHECK[0].checked = false

  // find which graphs match the selected tags
  var ins = [], outs = []
  var tag_list = Object.keys(TAGS)
  for (var i = 0; i < GRAPHS.length; i++) {
    var good = true
    for (var j = 0; j < selected.length; j++) {
      if(GRAPHS[i].tags.indexOf(tag_list[selected[j]])===-1){
          good = false
          break
      }
    }
    if(good)
      ins.push(i)
    else
      outs.push(i)
  }

  // remove unfitting graphs // TODO: remove with style / animation ?
  for (var i = 0; i < AS.length; i++) {
    if(ins.indexOf(i)!==-1){
      if(loading_as[i])
        loading_as[i].hidden = false
      AS[i].style.display = 'inline-block'
    }else{
      if(loading_as[i])
        loading_as[i].hidden = true
      AS[i].style.display = 'none'
    }
  }
  which_vignette_should_load()
  sizes_have_changed(false, true)

  // update counts
  var temp_tags = {}
  for (var i = 0; i < ins.length; i++) {
    for (var j = 0; j < GRAPHS[ins[i]].tags.length; j++) {
      if(temp_tags[GRAPHS[ins[i]].tags[j]])
        temp_tags[GRAPHS[ins[i]].tags[j]]++
      else
        temp_tags[GRAPHS[ins[i]].tags[j]] = 1
    }
  }
  for (var i = 0; i < tag_list.length; i++) {
    var counter = document.getElementById('tags').querySelector('label[for='+TAGS_CHECK[i+1].getAttribute('id')+'] div')
    if(temp_tags[tag_list[i]])
      counter.textContent = temp_tags[tag_list[i]]
    else
      counter.textContent = 0
  }

}

function navigate (direction, event) {
	event.stopPropagation()
	event.preventDefault()

  server_and_console.log('navigate to '+direction)

  if(direction==='archives') // to archives
		return ARCHIVES ? setup_graph(INDEX) : setup_archives(INDEX)
  if(typeof direction === 'number') // to specific graph
    return direction===INDEX && !ARCHIVES ? false : setup_graph(direction)
  if(direction==='prev' && GRAPHS[INDEX-1]) // to previous graph
    return setup_graph(INDEX-1)
  if(direction==='next' && GRAPHS[INDEX+1]) // to previous graph
    return setup_graph(INDEX+1)

  server_and_console.log('wrong navigation instructions')
}

function sizes_have_changed (aside_changed, section_changed) {
  // ARCHIVES flag should be properly set before calling this function
  var current_aside_rect = ASIDE.getBoundingClientRect()
  if(ARCHIVES){
    if(aside_changed)
      aside_rect = get_rect_post_anim(ASIDE)
    if(section_changed)
      section_rect = get_rect_post_anim(SECTION)
  }
  var old_base_height_on_aside = base_height_on_aside
  base_height_on_aside = !ARCHIVES || (aside_rect.height > section_rect.height)
  server_and_console.log('height is now based on '+(base_height_on_aside?'aside':'section'));
  if(base_height_on_aside != old_base_height_on_aside)
    if(base_height_on_aside){
      ASIDE.setAttribute('data-stuck', 'absolute-top')
      ASIDE.style.top = '0px'
      ASIDE.style.bottom = 'auto'
      ASIDE.style.position = 'absolute'
      if(current_aside_rect.top<0)
        window.scrollTo(0, -current_aside_rect.top)
    } else {
      ASIDE.setAttribute('data-stuck', 'absolute-top')
      ASIDE.style.top = (window.scrollY+current_aside_rect.top)+'px'
      ASIDE.style.bottom = 'auto'
      ASIDE.style.position = 'absolute'
    }
    function get_rect_post_anim(el){
      var el_clone = el.cloneNode(true)
      el.parentElement.insertBefore(el_clone, el)
      var rect = el_clone.getBoundingClientRect()
      el.parentElement.removeChild(el_clone)
      return rect
    }
}


function place_aside(position, top, force){
  if(force || !base_height_on_aside)
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
      } else if(aside_rect.bottom <= cached_inner_height){
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

function resize_el_height (el, flag) {
  if(flag){
    var el_clone = el.cloneNode(true)
    el_clone.style.height = 'auto'
    el.parentElement.insertBefore(el_clone, el)
    var rect = el_clone.getBoundingClientRect()
    el.parentElement.removeChild(el_clone)
    el.style.height = rect.height+'px'
  }else{
    el.style.height = 0+'px'
  }
}

function position_main_slide(ref_rect){
  SHEET.setRule('section a.expanded > div',{
    transform: 'translate(calc(65vw - '+(ref_rect.left + (ref_rect.width+REM)/2)+'px), calc(50vh - '+(ref_rect.top + ref_rect.height/2)+'px)) scale('+((.7 * cached_inner_width - REM)/ref_rect.width)+', '+((cached_inner_height - 2*REM)/ref_rect.height)+')'
  })
}

function update_logo_colors (index) {
  var color = GRAPHS[index].content.querySelector('svg path[stroke], svg polyline[stroke]').getAttribute('stroke')
  LOGO_ARROW_PATH.style.stroke = color
  LOGO_ARROW_HEAD.style.stroke = color
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

var svg_loading_queue = []
function load_svg (index, callback, increment) {
  // deal with multiple loading requests for the same graph
  if(GRAPHS[index].being_loaded && !GRAPHS[index].is_processed){
    server_and_console.warn('graph #'+index+' ('+GRAPHS[index].formatted_name+') was already requested, queing up callbacks')
    GRAPHS[index].loading_callbacks.push(callback)
    return
  }
  GRAPHS[index].being_loaded = true
  GRAPHS[index].loading_callbacks = callback ? [callback] : []

  // create queue and add `index` to it
  if(!svg_loading_queue){
    svg_loading_queue = []
  }
  if(svg_loading_queue.length<MAX_SIMULTANEOUS_SVG_REQUESTS){
    svg_loading_queue.push(index)
  }

  // skip loading if already loaded
	if(GRAPHS[index] && GRAPHS[index].content)
		return preprocess_svg(index)

  // return if already in queue or MAX_SIMULTANEOUS_SVG_REQUESTS reached
  var index_in_queue = svg_loading_queue.indexOf(index)
  if(index_in_queue===-1) {
    svg_loading_queue.push(index)
    GRAPHS[index].being_loaded = false
    server_and_console.log('queueing #'+index)
    return
  } else if (index_in_queue >= MAX_SIMULTANEOUS_SVG_REQUESTS) {
    return
  }

  server_and_console.log('loading graph #'+index)

  var increment = typeof increment === 'undefined' ? 0 : increment

  var httpRequest = new XMLHttpRequest()
	httpRequest.onreadystatechange = loaded_svg.bind(undefined, index, httpRequest, increment)
	httpRequest.open('GET', GRAPHS[index].path)
	httpRequest.send()

  function loaded_svg (index, httpRequest, increment) {
  	if (httpRequest.readyState === XMLHttpRequest.DONE) {
  		if (httpRequest.status === 200) {
        var temp_div = document.createElement('div')
        temp_div.innerHTML = httpRequest.responseText
  			GRAPHS[index].content = temp_div.firstElementChild
  			preprocess_svg(index)
  		} else {
        if(increment < 10)
  			  setTimeout(load_svg.bind(undefined, index, undefined, increment+1), 1000)
        else{
          server_and_console.warn('couldnt load graph '+index+' ('+GRAPHS[index].formatted_name+') after '+increment+' trials, giving up.')
          for (var i = 0, l = GRAPHS[index].loading_callbacks.length; i < l; i++) {
            if(GRAPHS[index].loading_callbacks[i])
              GRAPHS[index].loading_callbacks[i](false)
          }
          GRAPHS[index].being_loaded = false
          delete GRAPHS[index].loading_callbacks
        }
  		}
  	}
  }

  function preprocess_svg (index) {
    if(!GRAPHS[index].is_processed){
      server_and_console.log('preprocessing graph #'+index)
      var erase = GRAPHS[index].content.removeChild(GRAPHS[index].content.querySelector('[stroke="#FFFFFF"]'))
      erase.setAttribute('data-type', 'erase')
      erase.setAttribute('stroke', 'transparent')
      GRAPHS[index].content.appendChild(erase)
      AS[index].firstElementChild.appendChild(GRAPHS[index].content)
      if(FIRST_LANDING)
        setTimeout((function(index){
          if(FIRST_LANDING)
            intermediateprocess_svg(index)
        }).bind(undefined, index), 750)
      else
        intermediateprocess_svg(index)
    } else {
      postprocess_svg(index)
    }
  }
}

function intermediateprocess_svg (index) {
  FIRST_LANDING = false
  try_to_rewrite_with_paths(GRAPHS[index], FONT_LOADED, (function(index){
    GRAPHS[index].is_processed = true
    properly_size_svg(GRAPHS[index].content)
    postprocess_svg(index)
  }).bind(undefined, index))
}

function postprocess_svg (index) {
  for (var i = 0, l = GRAPHS[index].loading_callbacks.length; i < l; i++) {
    if(GRAPHS[index].loading_callbacks[i])
      GRAPHS[index].loading_callbacks[i](index)
  }
  GRAPHS[index].being_loaded = false
  delete GRAPHS[index].loading_callbacks
  svg_loading_queue.shift()
  if(svg_loading_queue.length>=MAX_SIMULTANEOUS_SVG_REQUESTS)
    load_svg(svg_loading_queue[MAX_SIMULTANEOUS_SVG_REQUESTS-1])
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
		var parent = svg.getBoundingClientRect()

    if(parent.width < parent.height)
      svg.style.width = (.9 * SIZE_FACTOR * viewbox[2]/10) + '%'
    else
      svg.style.height = (.9 * SIZE_FACTOR * viewbox[3]/10) + '%'
	}
}



////////////////////////
// SVG TO PNG LIBRARY //
////////////////////////

function set_img_from_urldata (index, urldata, img) {
  var img = put_overlay_image(index, img?img:urldata, img?urldata:undefined)
  if(GRAPHS[index].watermarked)
    load_watermark_from_server(img, index)
  else
    save_img_to_server(img, index)
}
function put_overlay_image(index, url, pre_img){
  img = pre_img || new Image()
  img.setAttribute('id', 'overlay')
  var svg_rect = MAIN.getElementsByTagName('svg')[0].getBoundingClientRect()
  img.height = svg_rect.height
  img.width = svg_rect.width
  img.setAttribute('alt',GRAPHS[index].name+'.png')
  if(!pre_img)
    MAIN.appendChild(img)
  img.src = url
  return img
}
function load_watermark_from_server (img, index) {
  server_and_console.log('loading watermarked img for #'+index+' from server')
  var temp_img = new Image()
  temp_img.onload = (function (img, temp_img) {
    GRAPHS[index].watermark_is_loaded = true
    img.src = temp_img.src
  }).bind(undefined, img, temp_img)
  temp_img.src = GRAPHS[index].watermarked
}
function save_img_to_server (img, index) {
  server_and_console.log('uploading img for #'+index+' to server, '+(GRAPHS[index].nofont?'wont':'will')+' save image')
  var params = 'dataURL=' + encodeURIComponent(img.src)
  var request = new XMLHttpRequest();
  request.open('POST', '/save_img.php?name='+GRAPHS[index].name+'&nosave='+(GRAPHS[index].nofont?'true':'false'), true);
  request.setRequestHeader('Content-type','application/x-www-form-urlencoded')
  request.onreadystatechange = (function (img, index, request) {
    if (request.readyState === 4 && request.status === 200){
      server_and_console.log('img for #'+index+' sucessfuly uploaded @ '+request.responseText)
      GRAPHS[index].watermarked = request.responseText
      load_watermark_from_server(img, index)
    }
  }).bind(undefined, img, index, request)
  request.send(params)
}
function svg_to_png (index, callback) {
  server_and_console.log('converting SVG to PNG')
  // clone
  var clone_svg = GRAPHS[index].content.cloneNode(true)
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
  text.textContent = 'whiteboard-comics.com' + (GRAPHS[index].author ? (' & ' + GRAPHS[index].author) : '')
  text.setAttribute('id', 'watermark')
  text.style.fontFamily = "'Droid Serif', Georgia, serif"
  text.style.opacity = .8
  clone_svg.appendChild(text)
  var viewbox = clone_svg.getAttribute('viewBox').split(' ')
  viewbox[3] = parseFloat(viewbox[3])+20
  text.setAttribute('transform', 'translate(5,'+(viewbox[3]-5)+')')
  clone_svg.setAttribute('viewBox', viewbox.join(' '))

  // create SVG => XML (img.src) => canvas => data => png
  var svgString = new XMLSerializer().serializeToString(clone_svg)
  var dimensions = {
    width: 800,
    height: 800/viewbox[2]*viewbox[3]
  }

  // this avoids creating an unnecessary BLOB, method found here: http://stackoverflow.com/questions/27619555/image-onload-not-working-with-img-and-blob
  var img = new Image()
  img.addEventListener('load', (function (img, dimensions, callback) {
    var canvas = document.createElement('canvas')
    canvas.setAttribute('width', dimensions.width)
    canvas.setAttribute('height', dimensions.height)
    var ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
    var png_data_url = ctx.canvas.toDataURL('image/png')
    callback(png_data_url)
    DOMURL.revokeObjectURL(png_data_url)
  }).bind(undefined, img, dimensions, callback))
  img.src = 'data:image/svg+xml;utf8,' + svgString
}

//////////////////////////////
// SVG FONT TO PATH LIBRARY //
//////////////////////////////

function try_to_rewrite_with_paths (graph, font_loaded, callback) {
  if(graph.nofont!==false){
    try{
      rewrite_with_paths (graph.content, font_loaded)
      graph.nofont = !font_loaded
    } catch (e) {
      try{
        server_and_console.warn('couldnt rewrite #'+graph.id+' with font, removing previous attempt ('+graph.formatted_name+')')
        var messed_up_writings = graph.content.querySelectorAll('[data-type=writing]')
        for (var i = 0, l = messed_up_writings.length; i < l; i++) {
          messed_up_writings[i].parentNode.removeChild(messed_up_writings[i])
        }
        rewrite_with_paths (graph.content, false)
      } catch (e) {
        server_and_console.warn('couldnt rewrite #'+graph.id+' at all. this is a big problem. ('+graph.formatted_name+')')
        var messed_up_writings = graph.content.querySelectorAll('[data-type=writing]')
        for (var i = 0, l = messed_up_writings.length; i < l; i++) {
          messed_up_writings[i].parentNode.removeChild(messed_up_writings[i])
        }
      }
      graph.nofont = true
    }
  }
  server_and_console.log('rewriting #'+graph.id+' '+(font_loaded?'with':'without')+' font loaded, '+(graph.nofont?'didnt':'did')+' use font')
  if(callback)
    callback()
}

function rewrite_with_paths (svg, font_loaded) {
	var texts = svg.getElementsByTagName('text')
	for (var text_pointer = 0; text_pointer < texts.length; text_pointer++) {
		var tspans = texts[text_pointer].getElementsByTagName('tspan')
		if(tspans.length===0){
			replace_span(texts[text_pointer], font_loaded)
		} else {
      var is_text_long = 0
      for (var i = 0; i < tspans.length; i++) {
				is_text_long += tspans[i].childNodes[0].nodeValue.length
			}
      is_text_long = is_text_long > 40
			for (var i = 0; i < tspans.length; i++) {
				replace_span(tspans[i], font_loaded, is_text_long)
			}
		}
	}

  function replace_span (reference_element, font_loaded, is_text_long) {
		if(reference_element.childNodes.length>1 || reference_element.childNodes[0].nodeType!==3){
			server_and_console.log(reference_element.childNodes)
      server_and_console.warn('this node still has children')
			return
		}

		var is_tspan = reference_element.tagName.toLowerCase()==='tspan'

    if(!font_loaded){
		  var x_length = 0
      if(is_tspan){
        var tspan_position = {
          x: parseFloat(reference_element.getAttribute('x')),
          y: parseFloat(reference_element.getAttribute('y'))
        }
  		} else {
        var tspan_position = {
          x: 0,
          y: 0
        }
      }
    }

		var text_transform = is_tspan ? reference_element.parentElement.getAttribute('transform') : reference_element.getAttribute('transform')

		var color = reference_element.getAttribute('fill')
		if(!color)
			color = is_tspan ? reference_element.parentElement.getAttribute('fill') : false

		var sentence = reference_element.childNodes[0].nodeValue
		var insert_at = is_tspan ? reference_element.parentElement : reference_element
		for (var char_pointer = 0; char_pointer < sentence.length; char_pointer++) {
			if(sentence.charAt(char_pointer)===' '){
        if(!font_loaded)
          x_length+=10
				continue
      }
			var letter = get_letter(sentence.charAt(char_pointer))
			if(!letter){
        server_and_console.warn('There is no letter \''+sentence.charAt(char_pointer)+'\' in the alphabet.')
				continue
      }
      if(font_loaded)
        var letter_pos = reference_element.getStartPositionOfChar(char_pointer)
			var el = document.createElementNS(SVG_NAMESPACE, 'g')
			el.innerHTML = letter.content // TODO: replace with appendChild ?
			var paths = el.querySelectorAll('path,line,polyline')
			for (var i = 0; i < paths.length; i++) {
        if(!font_loaded){
          var x = tspan_position.x + x_length + 2
    			var y = tspan_position.y - letter.viewbox.height + 10
    			paths[i].setAttribute('transform', text_transform+' translate(' + x + ',' + y + ')')
        } else {
          paths[i].setAttribute('transform', text_transform+' translate(' + letter_pos.x + ',' + (letter_pos.y - letter.viewbox.height + 10) + ')')
        }
				paths[i].setAttribute('data-type', 'writing')
        if(is_text_long)
          paths[i].setAttribute('data-long-writing', true)
				if(color)
					paths[i].setAttribute('stroke', color)
				insert_at.parentNode.insertBefore(paths[i], insert_at)
			}
      if(!font_loaded)
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
		server_and_console.warn('letter "'+letter+'" not found')
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
  var erase_path = svg.querySelector('[data-type="erase"]')
  if(!erase_path)
    return callback()
  start_drawing_element(erase_path, delay, callback)
}

function play_svg (svg, delay, callback) {
  server_and_console.log('playing MAIN svg')
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
    element.style.opacity = computedStyle.getPropertyValue('opacity')
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
    element.style.opacity = '1'
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
  var elements = parent.children || parent.childNodes // parent.children won't work on some oldre versions of safari
  for (var e = 0, le = elements.length; e < le; e++) {
    if (elements[e].nodeType === 3) // childNodes also returns text nodes, this ignores them
      continue
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
  element.style.opacity = '0'
}

function start_drawing_element (element, delay, callback) {
	var length = element.getTotalLength()

  if(element.getAttribute('data-type')==='writing' || !element.getAttribute('stroke')){
    var speed_power = element.getAttribute('data-long-writing') ? .1 : .25
    var smoothing = 'ease-out'
  } else if (element.getAttribute('data-type')==='erase'){
    var speed_power = .4
    var smoothing = 'linear'
  } else {
    var speed_power = .6
    var smoothing = 'ease-in-out'
  }

	var duration = .1/SPEED*Math.pow(length, speed_power)

	element.getBoundingClientRect() // TODO: this might need to be uncommented to trigger something (like a recalculation of some sorts)
	element.style.transition = 'stroke-dashoffset ' + duration + 's ' + smoothing + ' ' + delay + 's, opacity 0s '+ delay + 's'
	element.style.strokeDashoffset = '0'
	element.style.visibility = 'visible'
  element.style.opacity = '1'

	if (callback)
		setTimeout(callback, (delay+duration)*1000)

  return duration
}


////////////////////////
// LOGO SVG ANIMATION //
////////////////////////

var ANIMATING_LOGO
function logo_start_moving () {
  if(!ANIMATING_LOGO){
    ANIMATING_LOGO = true
    window.requestAnimationFrame(logo_move_along.bind(undefined, 1250, -1))
  }
}
function logo_move_along (duration, origin, timestamp) {
  if(origin===-1)
    origin = timestamp

  var delta = timestamp - origin
  if(delta > duration)
    delta = duration

  var ratio = delta / duration

  var point = LOGO_ARROW_PATH.getPointAtLength(ratio * logo_full_path_length)
  LOGO_ARROW_HEAD.style.transform = 'translate('+(point.x - 149.8)+'px, '+(point.y - 6)+'px)'
  LOGO_ARROW_PATH.style.strokeDashoffset = logo_body_length - (1+ratio) * logo_full_path_length
  if(delta<duration)
    window.requestAnimationFrame(logo_move_along.bind(undefined, duration, origin))
  else
    ANIMATING_LOGO = false
}
