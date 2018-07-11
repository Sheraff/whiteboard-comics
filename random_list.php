<?
	$files = glob('season 4/*.svg');
	shuffle($files);

	$str = '';
	for ($i=0; $i < count($files); $i++) {
		$str.=$files[$i]."\n";
	}

	file_put_contents('rando.txt', $str);

?>
