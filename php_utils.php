<?
  function format_svg($string){
    $string = preg_replace([
			'/<\?xml.*?>/',
			'/<!--.*?-->/',
			'/<!DOCTYPE.*?>/',
			'/ ?stroke-linejoin="round" ?/',
			'/ ?stroke-linejoin="bevel" ?/',
			'/ ?stroke-linecap="round" ?/',
			'/ ?stroke-width="4" ?/',
			'/ ?fill="none" ?/',
			'/ ?stroke="#(0[0-1]){3}" ?/',
			'/ ?fill="#(0[0-1]){3}" ?/',
			'/ ?stroke-miterlimit="10" ?/',
			'/ +/',
			'/d=" M/'
		], [
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			' ',
			'd="M'
		], $string);
		return $string;
  }
?>
