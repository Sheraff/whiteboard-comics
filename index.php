<!--
<?
	if(array_shift((explode(".",$_SERVER['HTTP_HOST'])))==='www'){
		header("HTTP/1.1 301 Moved Permanently");
		header("Location: http://whiteboard-comics.com");
		exit();
	}

	$master = $_GET['all'];
	$archives = isset($_GET['archives']) || $_SERVER['REQUEST_URI']==='/archives';

	require 'php_utils.php';

	// read METADATA
	$graphs = read_metadata($master, '.', $_GET['graph']?$_GET['graph']:'');

	// try and MATCH graph to query
	$initial_index = -1;
	foreach ($graphs as $key => $graph){
		if($_GET['graph'] && $graph[name]===$_GET['graph']){ // MATCH. Compare to rewriten URL, if it matches, we'll start with this one
			$initial_index = $key;
			break;
		}
	}
	if($initial_index===-1){ // if none matched the rewrited URL (or if URL wasn't rewrited), start with the latest one
		$initial_index = 0;
	}

	// create CONTENT bites
	$bites = extra_content($initial_index, $graphs);

	// not item specific content bites
	$archive_text = 'Archive of ' . count($graphs) . ' fantastic graphs.';
	$base = ($_SERVER[HTTPS]?'https':'http').'://'.$_SERVER[HTTP_HOST];

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
			['exclamation','question','coma','double','single','period','hashtag','dash','star','plus','equal','multiply','left_p','right_p','left_b','right_b','left_curly','right_curly','and','at','slash','percent'],
			['!','?',',','"',"'",'.','#','-','*','+','=','×','(',')','[',']','{','}','&','@','/','%'],
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
	<title>Whiteboard Comics — <? echo $archives ? 'Archives' : $graphs[$initial_index][formatted_name]; ?></title>
	<link rel="alternate" type="application/rss+xml" title="RSS Feed for Whiteboard Comics" href="/rss/" />
	<!-- <meta name="viewport" content="width=device-width, initial-scale=1"> -->
	<meta name="description" content="<? echo ($archives?$archive_text:$bites[description]); ?>">
	<meta name="keywords" content="whiteboard, comics, thoughts, procrastination, existential, sarcasm, drawing, indexed, svg, animated, charts, plots, graph, graphs, graphics, time, life, <? echo implode(', ', array_keys($tags_list)); ?>">
	<meta name="author" content="Florian Pellet">
	<meta name="language" content="en">
	<meta property="article:author" content="https://facebook.com/florian.pellet" />
	<meta property="article:author:first_name" content="Florian" />
	<meta property="article:author:last_name" content="Pellet" />
	<meta property="article:tag" content="<? echo $archives ? '' : implode('"/><meta property="article:tag" content="', $graphs[$initial_index][tags]); ?>"/>
  <meta property="article:published_time" content="<? echo date('c',$graphs[$initial_index][timestamp]); ?>" />
	<meta name="twitter:description" property="og:description" content="<? echo $archives ? $archive_text : $bites[description]; ?>"/>
	<meta name="twitter:image" property="og:image" content="http://whiteboard-comics.com/<? echo $graphs[$initial_index][thumbnail]; ?>"/>
	<meta name="twitter:url" property="og:url" content="http://whiteboard-comics.com/<? echo $archives ? 'archives' : $graphs[$initial_index][name]; ?>"/>
	<meta name="twitter:title" property="og:title" content="Whiteboard Comics — <? echo $archives ? 'Archives' : $graphs[$initial_index][formatted_name]; ?>"/>
	<base href="<? echo $base; ?>">
	<? if($initial_index!==0) echo "<link rel='prev' href='$bites[prev_page]'>"; ?>
	<? if($initial_index!==count($graphs)-1) echo "<link rel='next' href='$bites[next_page]'>"; ?>
	<link rel="icon" type="image/png" href="/favicon.png">
	<link href='/style.css' rel='stylesheet'>
</head>
<noscript><img src="http://whiteboard-comics.com/<? echo $graphs[$initial_index][thumbnail]; ?>" alt="<? echo $graphs[$initial_index][formatted_name]; ?>" /></noscript>
<aside <? echo $archives ? 'class="archives"' : ''; ?>>
	<a id="home" href="/">
		<header>
			<? echo file_get_contents("logo.svg"); ?>
			<h2><? echo strtolower($bites[h2]); ?></h2>
		</header>
	</a>
	<nav id="nav">
		<a id="prev" data-title="previous graph" href="<? echo $bites[prev_page]; ?>"><img src="/res/prev.svg">
		</a><a id="next" data-title="next graph" href="<? echo $bites[next_page]; ?>"><img src="/res/next.svg"></a>
	</nav>
	<div id="blurb">
		<p>This is a blurb I'm supposed to have written explaining how this website is insightful and funny, while still being an ironic side project.
		<p>A lot of the graphs presented on this website are about my life and relate to procrastination and poor strategic decision making regarding productivity. Sadly, they all contain a grain of personal truth. This is one of the reasons why this blurb is what it is.
	</div>
	<input type="checkbox" id="cog_check">
	<nav id="menu">
		<a id="archives" data-title="archives" href="/archives"><img src="/res/blocks.svg">
		</a><label id="cog" data-title="settings" for="cog_check" <? echo ($archives?'class="disabled"':''); ?>><img src="/res/cog.svg">
		</label><a id="rss" data-title="rss" href="/rss" target="_blank"><img src="/res/rss.svg">
		</a><a id="fb" data-title="facebook" href="https://www.facebook.com/existentialWhiteboardComics" target="_blank"><img src="/res/fb.svg"></a>
	</nav>
	<div id="settings">
		<label for="animation_check"><div id="animation">Drawing animation: <input id="animation_check" type="checkbox" checked></div></label>
		<div id="speed">Adjust speed: <input id="speed_input" type="range" name="speed" value="4" min="1" max="10"></div>
	</div>
	<ul id="tags">
		<input type='checkbox' id='tag_all' checked><label for='tag_all'><li><img src='/res/check.svg'><span>All</span><div><? echo count($graphs); ?></div></li></label>
		<?
			foreach ($tags_list as $tag => $count) {
				$simple_tag = strtolower(str_replace(' ', '', $tag));
				$name = ucwords($tag);
				echo "<input type='checkbox' id='tag_$simple_tag'><label for='tag_$simple_tag'><li><img src='/res/check.svg'><span>$name</span><div>$count</div></li></label>";
			}
		?>
	</ul>
	<footer>
		<a id="footer" href="http://florianpellet.com" target="_blank"><span id="copyright">© 2015 — </span><span id="website">florianpellet.com</span></a>
		<a id="contact" href="mailto:fpellet@ensc.fr" target="_blank">Do you have an idea for this site?</a>
	</footer>
</aside>
<section <? if(!$archives) echo 'class="expanded pre_expanded"'; ?>>
	<?
		foreach ($graphs as $index => $graph) {
			echo "<a data-index='$index' href='/$graph[name]'" . (!$archives&&$index===$initial_index?' class="expanded pre_expanded" ' : '') . "><div>";
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

</script>
<script language="javascript" type="text/javascript" src="/script.js"></script>
<link href='https://fonts.googleapis.com/css?family=Droid+Serif' rel='stylesheet' type='text/css'>
<? if(!$archives) { ?>
	<script type="application/ld+json">
		{
			"@context" : "http://schema.org",
			"@type" : "NewsArticle",
			"headline" : "<? echo $graphs[$initial_index][formatted_name]; ?>",
			"image" : [
				"<? echo $graphs[$initial_index][$graphs[$initial_index][watermarked] ? 'watermarked' : 'thumbnail']; ?>",
				"<? echo $graphs[$initial_index][path]; ?>"
			],
			"datePublished" : "<? echo date('c', $graphs[$initial_index][timestamp]); ?>",
			"description" : "<? echo $bites[description]; ?>"
		}
	</script>
<?}?>
<script type="application/ld+json">
	{
		"@context" : "http://schema.org",
		"@type" : "Organization",
		"name" : "Whiteboard Comics",
		"url" : "http://whiteboard-comics.com",
		"logo": "http://whiteboard-comics.com/logo-full.png",
		"sameAs" : [
			"https://www.facebook.com/existentialWhiteboardComics"
		]
	}
</script>
</html>



<!-- TODO
	BUGS
	- properly handle special chars in php (formatted_name could behave wierdly with '→' if used inside a regex)

	SVG ANIMATION
	- ability to adjust speed while drawing (will greatly improve the affordance of the speed control bar)
	- distinguish "verbose" graphs from "simple" graphs, make long <text> of "verbose" graphs write faster

	STYLE
	- make h2 as big as possible depending on content
	- smooth scrolling
		- for setup_archives()
		- for filter() only if vignettes are animated when added / removed

	FLUIDITY
	- animate ASIDE with "transform"
	- enable hardware acceleration (through CSS hacks) // TODO: done but could be done better
	- if possible, try and use .getBoundingClientRect() less often

	UX
	- attract attention to the possibility to see another graph (arrows / keyboard)
	- tab key behavior

	IMPROVE MOBILE VERSION

	SOCIAL
	- add GitHub button
	- add Donate button

	DURABILITY & MAINTAINABILITY
	- write readme so that the process is clear
		- groups in AI for timing
		- above/below in AI for scenario
		- rename artboards in AI for streamlining exports

	SEO
	- have more words on each graph (maybe a pun or a description or something)
	- enable caching
	- enable gzip



 -->
