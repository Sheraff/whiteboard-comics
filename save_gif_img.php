<?
  $dataURL = $_POST[dataURL];
  $name = $_GET[name];
  $img_nb = intval($_GET[img_nb]);
	$img_total = intval($_GET[img_total]);
  $encodedData = explode(',', $dataURL);
  $encodedData = $encodedData[1];
  $decodedData = base64_decode($encodedData);

  $filename = "png4gif/$name-$img_nb-$img_total.png";
  if(!file_exists('./png4gif')) mkdir('./png4gif');
  file_put_contents($filename, $decodedData);

  // if it is complete drawing and official .png doesn't exist, save it there too
  if($img_nb==$img_total && !file_exists("png/$name.png")){
    file_put_contents("png/$name.png", $decodedData);
  }
	// if all images are here, start creating gif, and echo indication that it's being created
	require_once('./GifCreator.php');

	$existing_imgs = preg_grep("/png4gif\/".preg_quote($name, '/').".*\.png/", glob("png4gif/*.png"));

	if(count($existing_imgs)>=$img_total+1){
		usort($existing_imgs, function($a,$b) {
			$a = intval(array_slice(explode('-', explode('.',$a)[0]), -2, 1)[0]);
			$b = intval(array_slice(explode('-', explode('.',$b)[0]), -2, 1)[0]);
			return $a>$b;
		});
		array_unshift($existing_imgs, $existing_imgs[count($existing_imgs)-1]);
		$durations = array_fill(0, $img_total+1, 4);
		array_push($durations, intval(200 + round($img_total/10)));
    $gc = new GifCreator\GifCreator();
		$gc->create($existing_imgs, $durations, 0);
		$gifBinary = $gc->getGif();
    if(!file_exists('./gif')) mkdir('./gif');
		file_put_contents("./gif/$name.gif", $gifBinary);
		echo "/gif/$name.gif";
		foreach ($existing_imgs as $key => $value) {
			if(file_exists($value)) unlink($value);
		}
	} else {
		echo false;
	}
?>
