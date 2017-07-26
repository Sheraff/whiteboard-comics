<!-- ♡ <?
	$width = 450;
	$_GET['graph'] = $_GET['graph'] ? $_GET['graph'] : urldecode(explode('.',array_pop(explode('/',$_SERVER['REQUEST_URI'])))[0]);
	require 'php_utils.php';

	// read METADATA
	$graphs = read_metadata($master, '.', $_GET['graph']?$_GET['graph']:'');

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
		<script async custom-element="amp-fit-text" src="https://cdn.ampproject.org/v0/amp-fit-text-0.1.js"></script>
		<link rel="canonical" href="<? echo $base . '/' . $graphs[$initial_index][name]; ?>">
		<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
		<? include('jsonld.php'); ?>
		<style amp-custom>
			body{
				width: <? echo $width; ?>px;
				text-align: center;
			}
			a{
				color: brown;
				border: 1px solid brown;
				padding: 5px;
				display: inline-block;
				margin-bottom: 10px;
			}
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
		<amp-fit-text width="<? echo $width; ?>" height="<? echo $width/3; ?>" layout="responsive">
			<? echo $graphs[$initial_index][name]; ?>
		</amp-fit-text>
		<a class="ampstart-btn caps ml1" <? if(strlen($bites[prev_page])!=0) echo 'href="' . $bites[prev_page] . '.html"'; ?>>Previous graph</a>
		<a class="ampstart-btn caps ml1" <? if(strlen($bites[next_page])!=0) echo 'href="' . $bites[next_page] . '.html"'; ?>>Next graph</a></br>
		<amp-anim width="<? echo $width; ?>" height="<? echo $bites[img_size][1]/$bites[img_size][0]*$width; ?>" src="<? echo $base . '/../' . $bites[preferred_img]; ?>" alt="<? echo $graphs[$initial_index][formatted_name]; ?>"></amp-anim>
		<br/><small>by Florian Pellet <br/>published on <? echo date('c', $graphs[$initial_index][timestamp]); ?></small>
	</body>
</html>
