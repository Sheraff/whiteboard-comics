<!--
<?
	if(array_shift((explode(".",$_SERVER['HTTP_HOST'])))==='www'){
		header("HTTP/1.1 301 Moved Permanently");
		header("Location: http://whiteboard-comics.com");
		exit();
	}

	$master = $_GET['all'];
	$archives = isset($_GET['archives']) || $_SERVER['REQUEST_URI']==='/archives';
	$archives = true; // DEBUG

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
</aside>
	<input type="checkbox" id="cog_check">
	<a class="home" href="./">
		<? echo file_get_contents("logo.svg"); ?>
	</a>
	<a class="home" href="./"><h2><? echo strtolower($h2); ?></h2></a>
	<a id="prev" class="nav" href="<? echo $prev_page; ?>" data-title="previous graph"><img src="res/prev.svg"></a><a id="next" class="nav" href="<? echo $next_page; ?>" data-title="next graph"><img src="res/next.svg"></a>
	<p id="blurb">This is a blurb I'm supposed to have written explaining how this website is insightful and funny, while still being an ironic side project.</p><p>A lot of the graphs presented on this website are about my life and relate to procrastination and poor strategic decision making regarding productivity. Sadly, they all contain a grain of personal truth. This is one of the reasons why this blurb is what it is.</p>
	<a id="archive" href="./archives" data-title="archives"><img src="res/stack.svg"></a><label for="cog_check" id="cog" data-title="settings"><img src="res/cog.svg"></label><a class="social" id="rss" href="./rss" data-title="rss"><img src="res/rss.svg"></a><a class="social" id="fb" href="https://www.facebook.com/existentialWhiteboardComics" target="_blank" data-title="facebook"><img src="res/fb.svg"></a>
	<div id="settings">
		<label for="animation_check"><div id="animation">Drawing animation: <input id="animation_check" type="checkbox" checked></div></label>
		<div id="speed">Adjust speed: <input id="speed_input" type="range" name="speed" value="4" min="1" max="10"></div>
	</div>
	<a id="footer" href="http://florianpellet.com" target="_blank"><span id="copyright">© 2015 — </span><span id="website">florianpellet.com</span></a>
	<a id="contact" href="mailto:fpellet@ensc.fr" target="_blank">Do you have an idea for this site?</a>
</aside>
<div id="dummy_section"></div>
<section <? if($archives) echo 'class="clicked pre_clicked"'; ?>>
	<?
		foreach ($graphs as $index => $graph) {
			echo "<a href='/$graph[name]'" . ($archives&&$index===$initial_index?' class="clicked pre_clicked" ' : '') . "><div>";
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
	var ARCHIVES = <? echo $archives . ';'; ?>
	var TAGS = <? echo json_encode($tags_list) . ';'; ?>
	var GRAPHS = <? echo json_encode($graphs) . ';'; ?>
	var INDEX = <? echo $initial_index . ';'; ?>
	var LETTERS = <? echo json_encode($letters).';'; ?>
	var main = document.getElementsByTagName('main')[0]
	GRAPHS[INDEX].content = main.replaceChild(document.createElement('svg'), main.firstElementChild)

	//////////////
	// ARCHIVES //
	//////////////






</script>
<script language="javascript" type="text/javascript" src="script.js"></script>
<link href='https://fonts.googleapis.com/css?family=Droid+Serif' rel='stylesheet' type='text/css'>
</html>


<!-- todo
	HARD PROBLEMS, MAJOR IMPROVEMENTS
	- ability adjust speed while drawing
	- make the archive page ajax too, with boards zooming in and out

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

	DURABILITY & MAINTAINABILITY
	- try and get valid / viewable SVG files through serving them via redirection and formatting them on the fly
	- some php is repeated across files => should be centralized
	- write readme so that the process is clear
		- groups in AI for timing
		- above/below in AI for scenario
		- rename artboards in AI for streamlining exports
		- run format_svg.php to pre-process svg


 -->
