<?
  $dataURL = $_POST[dataURL];
  $name = $_GET[name];
  $img_nb = intval($_GET[img_nb]);
	$img_total = intval($_GET[img_total]);
  $encodedData = explode(',', $dataURL);
  $encodedData = $encodedData[1];
  $decodedData = base64_decode($encodedData);

  $filename = "png4gif/$name-$img_nb-$img_total.png";
  file_put_contents($filename, $decodedData);

	// if all images are here, start creating gif, and echo indication that it's being created
	require_once('./GifCreator.php');
	use GifCreator\GifCreator;

	$existing_imgs = preg_grep("/png4gif\/".preg_quote($name, '/').".*\.png/", glob("png4gif/*.png"));
	if(count($existing_imgs)>=$img_total+1){
		usort($existing_imgs, function($a,$b) {
			$a = intval(array_slice(explode('-', explode('.',$a)[0]), -2, 1)[0]);
			$b = intval(array_slice(explode('-', explode('.',$b)[0]), -2, 1)[0]);
			return $a>$b;
		});

		array_unshift($existing_imgs, $existing_imgs[count($existing_imgs)-1]);
		$durations = array_fill(0, $img_total+1, 5);
		array_push($durations, 200);
		$gc = new GifCreator();
		$gc->create($existing_imgs, $durations, 0);
		$gifBinary = $gc->getGif();
		file_put_contents("./gif/$name.gif", $gifBinary);
		echo "/gif/$name.gif";
		foreach ($existing_imgs as $key => $value) {
			unlink($value);
		}
	} else {
		echo false;
	}
?>
