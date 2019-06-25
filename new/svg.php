<?php
	function format_svg($string){
		$string = preg_replace([
			'/<\?xml.*?>/',
			'/<!--.*?-->/',
			'/<!DOCTYPE.*?>/',
			'/ ?stroke-linejoin="round" ?/',
			'/ ?stroke-linejoin="bevel" ?/',
			'/ ?stroke-linecap="round" ?/',
			'/ ?stroke-width="4" ?/',
			'/ ?fill="none" ?/',
			'/ ?stroke="#(0[0-1]){3}" ?/',
			'/ ?fill="#(0[0-1]){3}" ?/',
			'/ ?stroke-miterlimit="10" ?/',
			'/ ?id=".*" ?/',
			'/PermanentMarker/',
			'/ +/',
			'/d=" M/'
		], [
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			"Permanent Marker",
			' ',
			'd="M'
		], $string);
		return $string;
	}

	$graph = $_GET['graph'];
	$file = "graphs/graphs_$graph.svg";
	if(file_exists($file)){
		echo format_svg(file_get_contents($file));
	} else {
		echo "404\n";
		echo $file;
	}
?>
