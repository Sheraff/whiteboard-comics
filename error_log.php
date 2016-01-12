<?
  if(!file_exists('error_logs'))
    mkdir('error_logs');

  $error_data = json_decode(file_get_contents('php://input'), true);

  $php_info = get_browser($_SERVER['HTTP_USER_AGENT'], true);
  $error_data[php] = [
    browser => $php_info['browser'],
    parent => $php_info[parent],
    platform => $php_info[platform]
  ];
  $error_data[ip] = $_SERVER['REMOTE_ADDR'];
  $error_data[ts] = time();

  file_put_contents("error_logs/$error_data[ip]-$error_data[ts].json", json_encode($error_data));
?>
