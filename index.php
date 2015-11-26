<!--
<?
	if(array_shift((explode(".",$_SERVER['HTTP_HOST'])))==='www'){
		header("HTTP/1.1 301 Moved Permanently");
		header("Location: http://whiteboard-comics.com");
		exit();
	}

	$master = $_GET['all'];
	$archives = isset($_GET['archives']) || $_SERVER['REQUEST_URI']==='/archives';
	// $archives = true; // DEBUG

	require 'php_utils.php';

	// read METADATA
	$graphs = read_metadata($master);

	// try and MATCH graph to query
	$initial_index = -1;
	foreach ($graphs as $key => $graph){
		if($_GET['graph'] && $graph[name]===$_GET['graph']){ // MATCH. Compare to rewriten URL, if it matches, we'll start with this one
			$initial_index = $key;
			break;
		}
	}
	if($initial_index===-1) // if none matched the rewrited URL (or if URL wasn't rewrited), start with the latest one
		$initial_index = 0;

	// create CONTENT bites
	// links
	$prev_page = $initial_index===0 ? '/' : $graphs[$initial_index-1][name];
	$next_page = $initial_index===count($graphs)-1 ? '/' : $graphs[$initial_index+1][name];
	// h2 subtitle
	$f_contents = file("subtitles.txt", FILE_SKIP_EMPTY_LINES | FILE_IGNORE_NEW_LINES);
  $h2 = $f_contents[rand(0, count($f_contents) - 1)];
	// OG sharing
	$thumbnail = $graphs[$initial_index][thumbnail];
	$name = $graphs[$initial_index][name];
	$formatted_name = $graphs[$initial_index][formatted_name];
	// archives
	$archive_text = 'Archive of ' . count($graphs) . ' fantastic graphs.';

	// list all tags
	$tags_list = [];
	foreach ($graphs as $graph) {
		if($graph[tags])
			foreach ($graph[tags] as $tag) {
				if($tags_list[$tag])
					$tags_list[$tag]++;
				else
					$tags_list[$tag] = 1;
			}
	}
	ksort($tags_list);

	// grab ALPHABET
	$globbed = glob("alphabet/*.svg");
	$letters = array();
	foreach ($globbed as $key => $file) {
		$letter = str_replace(['alphabet_', '.svg'], '', basename($file));
		$letter = str_replace(
			['exclamation','question','coma','double','single','period','hashtag','dash','star','plus','equal','multiply','left_p','right_p','left_b','right_b','left_curly','right_curly','and','at','slash'],
			['!','?',',','"',"'",'.','#','-','*','+','=','×','(',')','[',']','{','}','&','@','/'],
			$letter
		);
		$letters[] = [
			'content' => format_alphabet(file_get_contents($file)),
			'letter' => $letter
		];
	}

	// log VISIT COUNT initial page load
  file_put_contents ('visits.log', json_encode([
  	page => $graphs[$initial_index][name],
  	date => time(),
  	ip => $_SERVER[REMOTE_ADDR]
  ]) . ",\n", FILE_APPEND);

?>-->

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://ogp.me/ns/fb#">
<head>
	<meta charset="utf-8">
	<title>Whiteboard Comics — <? echo $archives ? 'Archives' : $formatted_name ?></title>
	<link rel="alternate" type="application/rss+xml" title="RSS Feed for Whiteboard Comics" href="/rss/" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="<? echo $h2 . '.' . ($archives?' '.$archive_text:''); ?>">
	<meta name="keywords" content="whiteboard, comics, thoughts, procrastination, existential, sarcasm, drawing, indexed, svg, animated, graph, graphs, graphics, time, life, body image, work, academia, morality, money, growing up">
	<meta name="author" content="Florian Pellet">
	<meta name="language" content="en">
	<meta property="og:description" content="<? echo $archives ? $archive_text : ($formatted_name . '. ' . $h2 . '.'); ?>"/>
	<meta property="og:image" content="http://whiteboard-comics.com/<? echo $thumbnail; ?>"/>
	<link rel="icon" type="image/png" href="/favicon.png">
	<style>
		section a.clicked>div{
			top: 0;
			left: -1rem;
		}
	</style>
	<link href='/style.css' rel='stylesheet'>
</head>
<style>
	main svg{
		max-width: 100%;
		max-height: 100%;
		overflow: visible;
	}
</style>
<noscript><img src="http://whiteboard-comics.com/<? echo $thumbnail; ?>" alt="<? echo $formatted_name; ?>" /></noscript>
<aside <? echo $archives ? 'class="archives"' : ''; ?>>
	<a id="home" href="/">
		<header>
			<? echo file_get_contents("logo.svg"); ?>
			<h2><? echo strtolower($h2); ?></h2>
		</header>
	</a>
	<nav id="nav">
		<a id="prev" data-title="previous graph" href="<? echo $prev_page; ?>"><img src="/res/prev.svg">
		</a><a id="next" data-title="next graph" href="<? echo $next_page; ?>"><img src="/res/next.svg"></a>
	</nav>
	<div id="blurb">
		<p>This is a blurb I'm supposed to have written explaining how this website is insightful and funny, while still being an ironic side project.
		<p>A lot of the graphs presented on this website are about my life and relate to procrastination and poor strategic decision making regarding productivity. Sadly, they all contain a grain of personal truth. This is one of the reasons why this blurb is what it is.
	</div>
	<input type="checkbox" id="cog_check">
	<nav id="menu">
		<a id="archives" data-title="archives" href="/archives"><img src="/res/stack.svg">
		</a><label id="cog" data-title="settings" for="cog_check" <? echo ($archives?'class="disabled"':''); ?>><img src="/res/cog.svg">
		</label><a id="rss" data-title="rss" href="/rss"><img src="/res/rss.svg">
		</a><a id="fb" data-title="facebook" href="https://www.facebook.com/existentialWhiteboardComics" target="_blank"><img src="/res/fb.svg"></a>
	</nav>
	<div id="settings">
		<label for="animation_check"><div id="animation">Drawing animation: <input id="animation_check" type="checkbox" checked></div></label>
		<div id="speed">Adjust speed: <input id="speed_input" type="range" name="speed" value="4" min="1" max="10"></div>
	</div>
	<ul id="tags">
		<input type='checkbox' id='tag_all' checked><label for='tag_all'><li><img src='/res/check.svg'><span>All</span><div><? echo count($files); ?></div></li></label>
		<?
			foreach ($tags_list as $tag => $count) {
				$simple_tag = strtolower(str_replace(' ', '', $tag));
				$name = ucwords($tag);
				echo "<input type='checkbox' id='tag_$simple_tag'><label for='tag_$simple_tag'><li><img src='/res/check.svg'><span>$name</span><div>$count</div></li></label>";
			}
		?>
		<input type='checkbox' id='tag_simple_tag'><label for='tag_simple_tag'><li><img src='/res/check.svg'><span>test</span><div>0</div></li></label>
		<input type='checkbox' id='tag_simple_tag'><label for='tag_simple_tag'><li><img src='/res/check.svg'><span>test</span><div>0</div></li></label>
		<input type='checkbox' id='tag_simple_tag'><label for='tag_simple_tag'><li><img src='/res/check.svg'><span>test</span><div>0</div></li></label>
	</ul>
	<footer>
		<a id="footer" href="http://florianpellet.com" target="_blank"><span id="copyright">© 2015 — </span><span id="website">florianpellet.com</span></a>
		<a id="contact" href="mailto:fpellet@ensc.fr" target="_blank">Do you have an idea for this site?</a>
	</footer>
</aside>
<div id="dummy_section"></div>
<section <? if(!$archives) echo 'class="clicked pre_clicked"'; ?>>
	<?
		foreach ($graphs as $index => $graph) {
			echo "<a data-index='$index' href='/$graph[name]'" . (!$archives&&$index===$initial_index?' class="clicked pre_clicked" ' : '') . "><div>";
			if($archives)
				echo format_svg(file_get_contents($graph[path]));
			echo "</div></a>";
		}
	?>
</section>
<main>
	<? if(!$archives) echo format_svg(file_get_contents($graphs[$initial_index][path])); ?>
</main>
<script>
	///////////////////
	// PHP VARIABLES //
	///////////////////
	var ARCHIVES = <? echo ($archives?'true':'false').';'; ?>
	var TAGS = <? echo json_encode($tags_list) . ';'; ?>
	var GRAPHS = <? echo json_encode($graphs) . ';'; ?>
	var INDEX = <? echo $initial_index . ';'; ?>
	var LETTERS = <? echo json_encode($letters).';'; ?>
	if(ARCHIVES){
		var as = document.querySelectorAll('section a>div')
		for (var i = 0; i < as.length; i++) {
			GRAPHS[i].content = as[i].firstElementChild
		}
	} else {
		var main = document.getElementsByTagName('main')[0]
		GRAPHS[INDEX].content = main.replaceChild(document.createElement('svg'), main.firstElementChild)
	}

	//////////////
	// ARCHIVES //
	//////////////
	var aside = document.getElementsByTagName('aside')[0]
	var section = document.getElementsByTagName('section')[0]
	var as = document.querySelectorAll('section a')
	var main = document.getElementsByTagName('main')[0]
	var recorded_section_height = section.getBoundingClientRect().height

	// init
	section.style.height = recorded_section_height
	document.getElementById('dummy_section').style.height = recorded_section_height+'px'
	var a_clicked = document.querySelector('a.clicked')
	if(a_clicked){
		var rect = a_clicked.getBoundingClientRect()
		chase_out_cards(as, rect)
		position_main_slide(rect)
	}

	var remember_scroll = 0
	for (var i = 0; i < as.length; i++) {
		as[i].addEventListener('click', exit_grid_view)
	}

	function exit_grid_view (event) {
		event.stopPropagation()
		event.preventDefault()

		// remember stuff before applying style
		var aside_rect = aside.getBoundingClientRect()
		remember_scroll = window.scrollY

		// fix section
		section.style.top = (-window.scrollY)+'px'

		// apply
		this.className = 'clicked'
		this.parentNode.className = 'clicked'

		// position ::before
		var rect = this.getBoundingClientRect()
		position_main_slide(rect)

		// chase out other <a>
		chase_out_cards(as, rect)

		// keep aside in place
		document.getElementById('dummy_section').style.height = aside.getBoundingClientRect().height+'px'
		if(aside.getAttribute('data-stuck')==='fixed-top')
			window.scrollTo(0,0)

		setup_page(parseInt(this.getAttribute('data-index'), 10), true)
	}

	function enter_grid_view() {
		// unfix section
		section.style.top = 0

		// apply
		var clicked_a = document.querySelector('section a.clicked')
		if(clicked_a){
			clicked_a.className = 'unclicked'
			clicked_a.parentNode.className = ''
			setTimeout((function (el) { if(el.className==='unclicked') el.className = '' }).bind(undefined, clicked_a), 1000)
		}

		// replace old scroll, keep aside in place
		var aside_rect = aside.getBoundingClientRect()
		document.getElementById('dummy_section').style.height = recorded_section_height+'px'
		window.scrollTo(0,remember_scroll)
		place_aside('absolute-bottom', window.scrollY+aside_rect.top>0 ? aside_rect.top : 0)
	}

	function chase_out_cards(cards, ref_rect){
		for (var i = 0; i < cards.length; i++) {
			var temp_rect = cards[i].getBoundingClientRect()
			if(temp_rect.top < ref_rect.top){
				cards[i].setAttribute('data-h', 'top')
			} else {
				cards[i].setAttribute('data-h', 'bot')
			}
		}
	}
	function position_main_slide(ref_rect){
		var sheet = document.styleSheets[0]
		var rules = sheet.cssRules || sheet.rules
		rules[0].style.top = 'calc('+(-ref_rect.top)+'px + 1rem)'
		rules[0].style.left = 'calc('+(-ref_rect.left)+'px + 30vw)'
	}


	// sticky sidebar
	var scrolled, old_scrollY = 0
	window.addEventListener('scroll', function (event) {
		scrolled = true
	});
	function place_aside(position, top){
		switch (position) {
			case 'absolute-top':
				aside.setAttribute('data-stuck', 'absolute-top')
				aside.style.top = window.scrollY+'px'
				aside.style.bottom = 'auto'
				aside.style.position = 'absolute'
				break;
			case 'fixed-bottom':
				aside.setAttribute('data-stuck', 'fixed-bottom')
				aside.style.top = 'auto'
				aside.style.bottom = 0
				aside.style.position = 'fixed'
				break;
			case 'absolute-bottom':
				aside.setAttribute('data-stuck', 'absolute-bottom')
				aside.style.top = (window.scrollY+top)+'px'
				aside.style.bottom = 'auto'
				aside.style.position = 'absolute'
				break
			case 'fixed-top':
				aside.setAttribute('data-stuck', 'fixed-top')
				aside.style.top = 0
				aside.style.bottom = 'auto'
				aside.style.position = 'fixed'
				break;
		}
	}
	(function sticky_aside() {
		if(scrolled){
			var diff = window.scrollY - old_scrollY
			var aside_rect = aside.getBoundingClientRect()
			if(diff>0){
				if(aside.getAttribute('data-stuck')==='fixed-top'){
					place_aside('absolute-top')
				} else if(aside_rect.bottom <= window.innerHeight){
					place_aside('fixed-bottom')
				}
			} else if (diff<0){
				if(aside.getAttribute('data-stuck')==='fixed-bottom'){
					place_aside('absolute-bottom', aside_rect.top)
				} else if(aside_rect.top >= 0){
					place_aside('fixed-top')
				}
			}
			scrolled = false
			old_scrollY = window.scrollY
		}
		window.requestAnimationFrame(sticky_aside)
	})()



</script>
<script language="javascript" type="text/javascript" src="script.js"></script>
<link href='https://fonts.googleapis.com/css?family=Droid+Serif' rel='stylesheet' type='text/css'>
</html>


<!-- todo
	HARD PROBLEMS, MAJOR IMPROVEMENTS
	- ability adjust speed while drawing
	- make the archive page ajax too, with boards zooming in and out

	FLUIDITY
	- archives' animations are super heavy

	UX
	- attract attention on the possibility to see another graph (arrows / keyboard)
	- tab key behavior

	IMPROVE MOBILE VERSION
	- remove self promo in footer
	- add settings
	- add icon for link to website
	- is an external font necessary ?

	SOCIAL
	- add GitHub button
	- add Donate button

	ROBUSTNESS
	- switch character positionning to SVG method getStartPositionOfChar() (instead of my in-house hack)
	⚠ other solution: switch to simply copying "transform" attribute (without forgetting the x,y of tspans)

	DURABILITY & MAINTAINABILITY
	- try and get valid / viewable SVG files through serving them via redirection and formatting them on the fly
	- some php is repeated across files => should be centralized
	- write readme so that the process is clear
		- groups in AI for timing
		- above/below in AI for scenario
		- rename artboards in AI for streamlining exports
		- run format_svg.php to pre-process svg

	SEO
	- allow for og:image and page title to be shown even before release date if name matches exactly (easier posting on facebook)
	- have more words on each graph (maybe a pun or a description or something)
	- create sitemap
	- enable caching
	- enable gzip
	- googlebot structured data

	<script type="application/ld+json">
		{
		  "@context": "http://schema.org",
		  "@type": "NewsArticle",
		  "headline": "Article headline",
		  "alternativeHeadline": "The headline of the Article",
		  "image": [
		    "thumbnail1.jpg",
		    "thumbnail2.jpg"
		  ],
		  "datePublished": "2015-02-05T08:00:00+08:00",
		  "description": "A most wonderful article",
		  "articleBody": "The full body of the article"
		}
	</script>

	<script type="application/ld+json">
		{
		  "@context" : "http://schema.org",
		  "@type" : "Organization",
		  "name" : "Your Organization Name",
		  "url" : "http://www.your-site.com",
			"logo": "http://www.example.com/images/logo.png",
		  "sameAs" : [
		    "http://www.facebook.com/your-profile",
		    "http://www.twitter.com/yourProfile",
		    "http://plus.google.com/your_profile"
		  ]
		}
	</script>


 -->
