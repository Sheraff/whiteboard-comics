<?
  $dataURL = $_POST["dataURL"];
  $name = $_GET["name"];
  $nosave = $_GET["nosave"]==='true';
  $encodedData = explode(',', $dataURL);
  $encodedData = $encodedData[1];
  $decodedData = base64_decode($encodedData);
  $filename = $nosave ? "png/$name-nokern.png" : "png/$name.png";
  file_put_contents($filename, $decodedData);
  echo $filename;

  if(!$nosave && file_exists("png/$name-nokern.png"))
    unlink("png/$name-nokern.png");
?>
