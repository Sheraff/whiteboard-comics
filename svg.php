<?
	$initial_index = -1;
	$files = array();

	// get graphs in reverse chronological order
	$globbed = glob("graphs/*.svg");
	rsort( $globbed );

	foreach ($globbed as $key => $file) {
		$name_pieces = explode('-', basename($file), 4);

		// push to array
		$files[] = [
			'path' => $file,
			'content' => false
		];

		// compare to rewrited URL, if it matches, we'll start with this one
		if($_GET['graph'] && $initial_index===-1 && $name_pieces[3]===$_GET['graph'].'.svg'){
			$initial_index = $key;
		}
	}

	// if none matched the rewrited URL (or if URL wasn't rewrited), start with the latest one
	if($initial_index===-1)
		$initial_index = 0;

	// load content for matched (or latest) graph
	$files[$initial_index][content] = file_get_contents($files[$initial_index][path]);

?>

<!DOCTYPE html>
<meta charset="utf-8">
<title>New Whiteboard</title>
<link href='./style.css' rel='stylesheet'>

<? echo $files[$initial_index][content]; ?>