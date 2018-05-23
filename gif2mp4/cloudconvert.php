<?php
require 'phar://CloudConvert/cloudconvert-php.phar/vendor/autoload.php';
use \CloudConvert\Api;
if(!file_exists('../mp4'))
	mkdir('./mp4');

function convertGIF($name){
	$api = new Api("M2Qg2sie7JguPYadghdSgvdCucW9yFEFfJV1YvI8ylSVoe4JJ132tEmhhDmEGUWO");
	$api->convert([
	        'inputformat' => 'gif',
	        'outputformat' => 'mp4',
	        'input' => 'upload',
	        'file' => fopen("./gif/$name.gif", 'r'),
	    ])
	    ->wait()
	    ->download("./mp4/$name.mp4");
}
?>
