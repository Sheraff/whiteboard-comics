<!-- ♡ <?
	$graph = $_GET['graph'];
	var_dump($graph);

	if(array_shift((explode(".",$_SERVER['HTTP_HOST'])))==='www'){
		header("HTTP/1.1 301 Moved Permanently");
		header("Location: $base");
		exit();
	}

	$master = $_GET['all'];
	$archives = isset($_GET['archives']) || $_SERVER['REQUEST_URI']==='/archives';

	require 'php_utils.php';

	// read METADATA
	$graphs = read_metadata($master, '.', $_GET['graph']?$_GET['graph']:'');
	var_dump($_GET);

	// try and MATCH graph to query
	$initial_index = -1;
	foreach ($graphs as $key => $graph){
		if($_GET['graph'] && $graph[name]===$_GET['graph']){ // MATCH. Compare to rewritten URL, if it matches, we'll start with this one
			$initial_index = $key;
			break;
		}
	}
	if($initial_index===-1){ // if none matched the rewritten URL (or if URL wasn't rewritten), start with the latest one
		$initial_index = 0;
	}

	// create CONTENT bites
	$bites = extra_content($initial_index, $graphs);

	// not item specific content bites
	$base = ($_SERVER[HTTPS]?'https':'http').'://'.$_SERVER[HTTP_HOST];

?>-->

<!doctype html>
<html ⚡>
	<head>
		<meta charset="utf-8">
		<script async src="https://cdn.ampproject.org/v0.js"></script>
		<script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
		<link rel="canonical" href="<? echo $base . '/' . $graphs[$initial_index][name]; ?>">
		<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
		<? include('jsonld.php'); ?>
		<style amp-custom>

		</style>
		<style amp-boilerplate>
			body{
				-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
				-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
				-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
				animation:-amp-start 8s steps(1,end) 0s 1 normal both
			}
			@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
			@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
			@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
			@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
			@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
		</style>
		<noscript><style amp-boilerplate>
			body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}
		</style></noscript>
	</head>
	<body>
		<h1><? echo $graphs[$initial_index][formatted_name]; ?></h1>
		<a href="<? echo $bites[prev_page] . '.html'; ?>">Previous graph</a>
		<a href="<? echo $bites[next_page] . '.html'; ?>">Next graph</a><br/>
		<amp-anim width="<? echo $bites[img_size][0]; ?>" height="<? echo $bites[img_size][1]; ?>" src="<? echo $base . '/../' . $bites[preferred_img]; ?>" alt="<? echo $graphs[$initial_index][formatted_name]; ?>"></amp-anim>
		<br/><small>By Florian Pellet, Published: <? echo date('c', $graphs[$initial_index][timestamp]); ?></small>
	</body>
</html>
