<?
  $date = DateTime::createFromFormat('Y-m-d', '2017-07-17');
  $final_str = '';
  for ($i=0; $i < 52; $i++) {
    $final_str.=$date->format('Y-m-d')."\n";
    $date->modify('+7 days');
  }
  file_put_contents('releases.txt', $final_str);
?>
