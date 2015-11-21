<!--
<?
	date_default_timezone_set('America/Los_Angeles');

	function path_to_components($path){
		$name_pieces = explode('-', basename($path), 4);

		$tags = explode('$', substr($name_pieces[3], 0, -4));
		if(count($tags)>1)
			$name = array_shift($tags);
		else{
			$name = $tags[0];
			$tags = false;
		}

		return [
			'path' => $path,
			'name' => $name,
			'release_date_pieces' => [$name_pieces[0], $name_pieces[1], $name_pieces[2]],
			'release_date' => strtotime("$name_pieces[0]-$name_pieces[1]-$name_pieces[2] 8:45:00"),
			'thumbnail' => str_replace(['graphs/', '.svg', '$'], ['png/', '.png', '#'], $path),
			'formatted_name' => trim( ucwords( preg_replace('/_/', ' ', preg_replace('/,/', ', ', preg_replace('/([=\(\)])/', ' $1 ', $name) ) ) ) ),
			'tags' => $tags
		];
	}

	$archives = isset($_GET['archives']) || $_SERVER['REQUEST_URI']==='/archives';

	// debug
	// $archives = true;

	$latest_release = -1;
	$initial_index = -1;
	$files = array();

	// get graphs in reverse chronological order
	$globbed = glob("graphs/*.svg");
	rsort( $globbed );

	foreach ($globbed as $key => $file) {
		$parsed = path_to_components($file);

		// TIME. Release time is at 8:45am Los Angeles time (11:45am NYC, 5:45pm Paris) <=> (before work LA, before lunch NYC, after work Paris)
		if($parsed[release_date] > time())
			continue;
		if($latest_release===-1)
			$latest_release = count($files)-1;

		// LOG
		$parsed[content] = false;
		$files[] = $parsed;

		// MATCH. Compare to rewriten URL, if it matches, we'll start with this one
		if($_GET['graph'] && $initial_index===-1 && $parsed[name]===$_GET['graph'])
			$initial_index = count($files)-1;
	}

	// if none matched the rewrited URL (or if URL wasn't rewrited), start with the latest one
	if($initial_index===-1){
		$initial_index = $latest_release;
		echo "use latest release $initial_index\n";
	} else
		echo "use matched name $initial_index\n";

	// load content for matched (or latest) graph
	$files[$initial_index][content] = file_get_contents($files[$initial_index][path]);

	$prev_page = $initial_index===$latest_release ? '/' : path_to_components($files[$initial_index-1][path])[name];
	$next_page = $initial_index===count($files)-1 ? '/' : path_to_components($files[$initial_index+1][path])[name];

	// random subtitle for H2
	$f_contents = file("subtitles.txt", FILE_SKIP_EMPTY_LINES | FILE_IGNORE_NEW_LINES);
  $h2 = $f_contents[rand(0, count($f_contents) - 1)];

  // log initial page load
  file_put_contents ('visits.log', json_encode([
  	page => $files[$initial_index][name],
  	date => time(),
  	ip => $_SERVER[REMOTE_ADDR]
  ]) . ",\n", FILE_APPEND);

  // get infos for OG sharing
  $parsed = path_to_components($files[$initial_index][path]);
  $thumbnail = $parsed[thumbnail];
  $name = $parsed[name];
	$formatted_name = $parsed[formatted_name];
?>-->

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://ogp.me/ns/fb#">
<head>
	<meta charset="utf-8">
	<title>Whiteboard Comics — <? echo $archives ? 'Archives' : $formatted_name ?></title>
	<link rel="alternate" type="application/rss+xml" title="RSS Feed for Whiteboard Comics" href="/rss/" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="<? echo $h2; ?>">
	<meta name="keywords" content="whiteboard,comics,thoughts,procrastination,existential,sarcasm,drawing,indexed,svg,animated,graph,graphs,graphics,time,life,image,body,work,academia">
	<meta name="author" content="Florian Pellet">
	<meta name="language" content="en">
	<meta property="og:description" content="<? echo $formatted_name . '. ' . $h2 . '.'; ?>"/>
	<meta property="og:image" content="http://whiteboard-comics.com/<? echo $thumbnail; ?>"/>
	<link rel="icon" type="image/png" href="favicon.png">
	<link href='style.css' rel='stylesheet'>
	<style>
		main svg path, main svg line, main svg polyline{
			stroke-linecap: round;
			stroke-linejoin: round;
			stroke-miterlimit: 10;
			fill: none;
		}
		main svg path:not([stroke]), main svg line:not([stroke]), main svg polyline:not([stroke]){
			stroke: black;
		}
		main svg path:not([stroke-width]), main svg line:not([stroke-width]), main svg polyline:not([stroke-width]){
			stroke-width: 4;
		}
		main svg [data-type=erase]{
			stroke-linejoin: bevel;
		}
	</style>
</head>
<aside>
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
<main>
	<svg></svg>
</main>
<script>
	///////////////////
	// PHP VARIABLES //
	///////////////////
	var GRAPHS = <? echo json_encode($files) . ';'; ?>
	var INDEX = <? echo $initial_index . ';'; ?>
</script>
<script language="javascript" type="text/javascript" src="script.js"></script>
<link href='https://fonts.googleapis.com/css?family=Roboto+Slab:300' rel='stylesheet' type='text/css'>
</html>


<!-- todo
	ability adjust speed while drawing
	make the archive page ajax too, with boards zooming in and out

	KEYBOARDS CONTROLS
	- left/right to navigate graphs
	- tab key behavior

	IMPROVE MOBILE VERSION
	- remove self promo in footer
	- add settings
	- add icon for link to website
	- is an external font necessary ?

	try out Vollkorn webfont instead of Roboto Slab

	add GitHub button
	add Donate button

	MORE FLEXIBILITY
	- SVG metadata stored somewhere else than in the filenames
	- rename ARTBOARDS in illustrator so that exports (and re-exports) are more straightforward
	⚠ for now, spans outside the SVG tags will be ignored (#authorship)

	ALLOW FOR SHARING OF IMAGES
	- authorship / credits must go in a <text></text> svg element, along with the whiteboard-comics.com watermark
		- they must be set as transparent
		- they must be used to create an external SPAN element (to mimic how it works right now)
	- JS must be used to dynamically generate a .png based on SVG, and said png must be SRC attribute of IMG (look at how it's done in FBTF logo generator)
	- IMG must be overlayed (⚠ z-index) within MAIN (position absolute, height 100%, width 100%) on top of SVG and beneath PUBDATE and AUTHORSHIP
		- possibly, IMG could be set to be exactly the size of SVG (change to be made @ each change of SVG)
	⚠ how is the image going to be named then?


 -->
