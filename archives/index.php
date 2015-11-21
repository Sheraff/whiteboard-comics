
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta charset="utf-8">
	<title>Whiteboard Comics — Archives</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="keywords" content="life,comics,thoughts,procrastination,existential,sarcasm,drawing,indexed,graph,svg,animated">
	<meta name="author" content="Florian Pellet">
	<meta name="language" content="en">
	<link rel="icon" type="image/png" href="favicon.png">
	<link href='http://fonts.googleapis.com/css?family=Permanent+Marker' rel='stylesheet' type='text/css'>
	<link href='https://fonts.googleapis.com/css?family=Roboto+Slab:300' rel='stylesheet' type='text/css'>
	<link href='../style.css' rel='stylesheet'>
	<style>
		svg{
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			width: 90%;
		}
		svg [data-type="erase"]{
			visibility: hidden;
		}
		svg text{
			fill: white;
		}
		.container{
			position: relative;
			float: left;
			width: 31.3vw;
			height: 31.3vw;
			margin: 1vw;
			background-color: white;
			box-shadow: 0 0 .5rem rgba(0,0,0,.5);
			transition: all .2s;
		}
		.container:hover{
			box-shadow: .75rem .75rem 1rem rgba(0,0,0,.5);
			transform: scale(1.05);
		}
		#authorship, a.credits{
			display: none;
		}

		@media (orientation: portrait) {
			.container{
				width: 48vw;
				height: 48vw;
				margin: 1vw;
			}
		}
	</style>
</head>

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

	// get graphs in reverse chronological order
	$globbed = glob("../graphs/*.svg");
	rsort( $globbed );
	
	foreach ($globbed as $key => $file) {
		$parsed = path_to_components($file);

		// skip the ones that shouldn't be released yet. Release time is at 8:45am Los Angeles time (11:45am NYC, 5:45pm Paris) <=> (before work LA, before lunch NYC, after work Paris)
		if($parsed[release_date] > time())
			continue;

		echo "<a class='container' href='/$parsed[name]'>" . file_get_contents($file) . '</a>';

	}
?>


</html>