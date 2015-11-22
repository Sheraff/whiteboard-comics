<?
	include 'php_utils.php';
	$graph = $_GET['graph'];
	$file = "graphs/$graph";
	if(file_exists($file)){
		echo format_svg(file_get_contents($file));
	}
?>
