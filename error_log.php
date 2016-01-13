<?
  if(!file_exists('error_logs'))
    mkdir('error_logs');

  $filename = "error_logs/$_SERVER[REMOTE_ADDR]-$_GET[ts].json";
  $error_data = json_decode(file_get_contents('php://input'), true);

  if(file_exists($filename)){
    $log = json_decode(file_get_contents($filename), true);
    array_push($log[message], $error_data[message]);
  } else {
    $php_info = get_browser($_SERVER[HTTP_USER_AGENT], true);
    $log = $error_data;
    $log[message] = [$log[message]];
    $log[php] = [
      browser => $php_info[browser],
      parent => $php_info[parent],
      platform => $php_info[platform]
    ];
    $log[ip] = $_SERVER[REMOTE_ADDR];
    $log[ts] = time();
  }

  file_put_contents($filename, json_encode($log));
?>
