<?
	include 'php_utils.php';
	$graph = $_GET['graph'];
	$file = "graphs/graphs_$graph.svg";
	if(file_exists($file)){
		echo format_svg(file_get_contents($file));
	} else {
		echo "404\n";
		echo $file;
	}
?>
