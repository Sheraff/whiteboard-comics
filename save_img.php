<?
  $dataURL = $_POST["dataURL"];
  $name = $_GET["name"];
  $encodedData = explode(',', $dataURL);
  $encodedData = $encodedData[1];
  $decodedData = base64_decode($encodedData);
  file_put_contents("png/$name.png", $decodedData);
  echo "png/$name.png";
?>
