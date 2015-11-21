<?
  foreach (glob("graphs/*.svg") as $key => $file) {
    $file_content = file_get_contents($file);

    $file_content = preg_replace([
      '/([^>])(\n|\r)([\t\s]?)*/',
      '/ ?stroke-linejoin="round" ?/',
      '/ ?stroke-linejoin="bevel" ?/',
      '/ ?stroke-linecap="round" ?/',
      '/ ?stroke-width="4" ?/',
      '/ ?fill="none" ?/',
      '/ ?stroke="#(0[0-1]){3}" ?/',
      '/ ?stroke-miterlimit="10" ?/',
      '/ +/'
    ], [
      '$1 ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' '
    ], $file_content);

    file_put_contents($file, $file_content);
  }

?>
