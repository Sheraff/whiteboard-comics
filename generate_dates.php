<?
  $date = DateTime::createFromFormat('Y-m-d', '2015-12-07');
  $final_str = '';
  for ($i=0; $i < 73; $i++) {
    $final_str.=$date->format('Y-m-d')."\n";
    $date->modify('+4 days');
    $final_str.=$date->format('Y-m-d')."\n";
    $date->modify('+3 days');
    $i++;
  }
  file_put_contents('releases.txt', $final_str);
?>
