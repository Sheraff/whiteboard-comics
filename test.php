<?
	$metadata = str_getcsv(file_get_contents("graph_list.tsv"), "\n");
	$row = str_getcsv($metadata[count($metadata)-4], "\t");

	// $coucou = "(being)⋂(aspiration)=worth";
	$coucou = $row[1];

	echo preg_replace([
		'/_/',
		'/,/',
		'/([=\(\)])/',
		'/ +/'
	], [
		' ',
		', ',
		' $1 ',
		' '
	], $coucou);

	echo ucwords($coucou);

	echo trim($coucou);
?>
