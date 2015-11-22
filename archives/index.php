
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
	<link href='https://fonts.googleapis.com/css?family=Permanent+Marker' rel='stylesheet' type='text/css'>
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
			stroke: white;
			stroke-linejoin: bevel;
		}
		svg text{
			fill: black;
			font-family: 'Permanent Marker', 'Chalkboard', 'Comic Sans MS', Arial;
		}
		svg path, svg line, svg polyline{
			stroke-linecap: round;
			stroke-linejoin: round;
			stroke-miterlimit: 10;
			fill: none;
		}
		svg path:not([stroke]), svg line:not([stroke]), svg polyline:not([stroke]){
			stroke: black;
		}
		svg path:not([stroke-width]), svg line:not([stroke-width]), svg polyline:not([stroke-width]){
			stroke-width: 4;
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
	// set TIMEZONE
	date_default_timezone_set('America/Los_Angeles');
	$time = time();

	// read METADATA
	$graphs = array();
	$metadata = str_getcsv(file_get_contents('../graph_list.tsv'), "\n");
	foreach($metadata as $key => &$row){
		$row = str_getcsv($row, "\t");
		if($key===0)
			continue;
		$temp = $row;
		$row = [];
		foreach($temp as $key => $item)
			$row[$metadata[0][$key]] = $item;
		$row[timestamp] = strtotime("$row[release] 8:45:00");
		$row[release] = explode('-', $row[release]);
		$row[path] = "graphs/graphs_$row[name].svg";
		$row[thumbnail] = "png/$row[name].png";
		$row[tags] = str_getcsv($row[tags]);
		$row[formatted_name] = trim( ucwords( preg_replace('/_/', ' ', preg_replace('/,/', ', ', preg_replace('/([=\(\)])/', ' $1 ', $row[name]) ) ) ) );
		$row[content] = false;
		if($row[timestamp] < $time) // TIME. Release time is at 8:45am Los Angeles time (11:45am NYC, 5:45pm Paris)
			$graphs[] = $row;
	}

	// order graphs // debug: this shouldn't need to happen
	function anti_chronological($a, $b){
		if($a[timestamp]===$b[timestamp])
			return 0;
		return $a[timestamp] > $b[timestamp] ? -1 : 1;
	}
	usort($graphs, 'anti_chronological');

	// try and MATCH graph to query
	foreach ($graphs as $key => $graph){
		echo "<a class='container' href='/$graph[name]'>" . file_get_contents('../'.$graph[path]) . '</a>';
	}
?>


</html>
