<?
	$globbed = glob("alphabet/*.svg");
	$letters = array();
	foreach ($globbed as $key => $file) {
		$letter = str_replace(['alphabet_', '.svg'], '', basename($file));
		$letter = str_replace([
			'exclamation',
			'question',
			'coma',
			'double',
			'single',
			'period',
			'hashtag',
			'dash',
			'star',
			'plus',
			'equal',
			'left_p',
			'right_p',
			'left_b',
			'right_b',
			'left_curly',
			'right_curly',
			'and',
			'at',
			'slash'
		], [
			'!',
			'?',
			',',
			'"',
			"'",
			'.',
			'#',
			'-',
			'*',
			'+',
			'=',
			'(',
			')',
			'[',
			']',
			'{',
			'}',
			'&',
			'@',
			'/'
		], $letter);
		$letters[] = [
			'content' => file_get_contents($file),
			'letter' => $letter
		];
	}
?>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://ogp.me/ns/fb#">
<head>
	<meta charset="utf-8">
</head>
<style>
main svg path, main svg line, main svg polyline{
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-miterlimit: 10;
	fill: none;
}
main svg path:not([stroke]), main svg line:not([stroke]), main svg polyline:not([stroke]){
	stroke: black;
}
main svg path:not([stroke-width]), main svg line:not([stroke-width]), main svg polyline:not([stroke-width]){
	stroke-width: 4;
}
main svg [data-type=erase]{
	stroke-linejoin: bevel;
}
</style>
<main>
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 904.5 357.5" enable-background="new 0 0 904.5 357.5" xml:space="preserve">
 <path data-type="erase" stroke="#FFFFFF" stroke-width="120" d="M868.4,35.1 c-54.5-4.3-109.1-8.5-163.6-12.8c-17.6-1.4-35.3-2.7-52.9-2c-23,1-45.8,5.7-68.6,8.6c-62,8-124.8,3.6-187.3,3 c-21.1-0.2-42.4,0-63.3,3.1c-19.2,2.8-37.9,8-56.6,13C200.1,68.2,121.7,85.9,43.5,78.1c87.6,0.7,175.2,1.4,262.7,2.1 c-4.1,24,0.3,48.4,1.6,72.7s-1.3,50.5-16.7,69.2C348,146.1,435.9,93.9,529.9,80.3c-40.5,59.7-129.2,69.8-171.5,128.2 c-6.3,8.7-11.5,18.3-19.8,25.1c-6.8,5.5-15.1,8.6-22.1,13.8c-16.6,12.4-23.2,35-39.8,47.4c-19.1,14.3-45.5,11.3-69.3,12 c-28.3,0.8-56.2,7.7-84.4,9.8c-25.6,1.9-89.9-2.1-114.8-8.1c63.4-2.3,165.5,0.3,228.9,4c24.4,1.4,49.9,3.7,70.4,17 c1.1-15.3,9.3-29.3,18.8-41.3c27.5-34.6,67-57.1,105.5-78.9c36.9-20.8,73.8-41.7,110.7-62.5c-24.8,28.9-45.5,61.4-61.2,96.1 c54.2,0.3,100.4-46.4,154.6-45.4c-41.3,34.6-80,72.3-115.5,112.9c59.2-19.2,114.6-50.1,161.9-90.5c19.2-16.4,38.3-34.9,62.8-40.9 c-16.5,34.7-37.6,67.3-62.6,96.5c56.7-17.1,92.6-75.6,148.5-95.1c-9.6,17.4-17.6,35.7-24,54.6c11.8,5.8,24.6-6.6,29.8-18.7 c5.2-12.1,9-26.8,21-32.3"/>
 <g>
	<line stroke-width="7" x1="273.6" y1="198.1" x2="857" y2="198.1"/>
	<polyline stroke-width="7" points=" 835,175.6 857,198.1 835,220.6 	"/>
	<line stroke-width="7" x1="372.5" y1="190.5" x2="372.5" y2="206.5"/>
	<line stroke-width="7" x1="449.5" y1="190.5" x2="449.5" y2="206.5"/>
	<line stroke-width="7" x1="526.5" y1="190.5" x2="526.5" y2="206.5"/>
	<line stroke-width="7" x1="603.5" y1="190.5" x2="603.5" y2="206.5"/>
	<line stroke-width="7" x1="680.5" y1="190.5" x2="680.5" y2="206.5"/>
	<line stroke-width="7" x1="757.5" y1="190.5" x2="757.5" y2="206.5"/>
 </g>
 <g>
 	<text transform="matrix(1 0 0 1 273.5581 41.569)" font-family="'PermanentMarker'" font-size="31">going out drinking on a wednesday is...</text>
 	<text transform="matrix(1 0 0 1 39.3198 86.4499)" font-family="'PermanentMarker'" font-size="31">a great idea !!!</text>
	<text transform="matrix(1 0 0 1 13.9956 313.1345)" font-family="'PermanentMarker'" font-size="31">a really bad idea</text>
 </g>
 <text transform="matrix(1 0 0 1 319.9399 237.6364)" font-family="'PermanentMarker'" font-size="31">m</text>
 <text transform="matrix(1 0 0 1 400.1333 237.6364)" font-family="'PermanentMarker'" font-size="31">t</text>
 <text transform="matrix(1 0 0 1 474.2979 237.6364)" font-family="'PermanentMarker'" font-size="31">w</text>
 <text transform="matrix(1 0 0 1 555.4287 237.6364)" font-family="'PermanentMarker'" font-size="31">t</text>
 <text transform="matrix(1 0 0 1 634.3052 237.6364)" font-family="'PermanentMarker'" font-size="31">f</text>
 <text transform="matrix(1 0 0 1 711.9033 237.6364)" font-family="'PermanentMarker'" font-size="31">s</text>
 <text transform="matrix(1 0 0 1 789.5518 237.6364)" font-family="'PermanentMarker'" font-size="31">s</text>
 <polyline stroke-width="7" points=" 273.6,76.5 296.1,54.5 318.6,76.5 	"/>
 <line stroke-width="7" x1="296.1" y1="54.5" x2="296.1" y2="341.8"/>
 <polyline stroke="#F68D3D" stroke-width="7" points=" 296.2,198.6 526.5,76.5 526.5,313.1 834.6,198.1 "/>
 <text id='watermark' transform="matrix(1 0 0 1 749.0063 345.9777)" font-family="'RobotoSlab-Regular'" font-size="12">whiteboard-comics.com</text>
 </svg>
</main>
<script>

var letters = <? echo json_encode($letters).';'; ?>
for (var i = 0; i < letters.length; i++) {
	var el = document.createElement('div')
	el.innerHTML = letters[i].content
	el = el.getElementsByTagName('svg')[0]
	var viewbox = (el.getAttribute('viewbox') || el.getAttribute('viewBox')).split(' ')
	letters[i].viewbox = {
		width: parseFloat(viewbox[2]),
		height: parseFloat(viewbox[3])
	}
	letters[i].content = el.innerHTML
}


var svg = document.getElementsByTagName('svg')[0]

var texts = svg.getElementsByTagName('text')

for (var text_pointer = 0; text_pointer < texts.length; text_pointer++) {
	var text = texts[text_pointer]

	if(text.getAttribute('id')==='watermark')
		continue

	var text_position = text.getAttribute('transform').slice(7,-1).split(' ')
	text_position = {
		x: parseFloat(text_position[4]),
		y: parseFloat(text_position[5])
	}

	var sentence = text.innerHTML

	var char_pointer = 0
	var x_length = 0
	for (var char_pointer = 0; char_pointer < sentence.length; char_pointer++) {
		if(sentence[char_pointer]===' '){
			x_length+=12
			continue
		}

		var letter = get_letter(sentence.charAt(char_pointer))
		if(!letter)
			continue
		var el = document.createElementNS('http://www.w3.org/2000/svg', 'g')
		el.innerHTML = letter.content
		var paths = el.querySelectorAll('path,line,polyline')
		for (var i = 0; i < paths.length; i++) {
			var x = text_position.x + x_length
			var y = text_position.y - letter.viewbox.height + 10
			paths[i].setAttribute('transform', 'translate(' + x + ',' + y + ')')
			paths[i].setAttribute('class','writing')
			text.parentNode.insertBefore(paths[i], text)
		}
		x_length += letter.viewbox.width + .5
	}
	text.style.display = 'none'
}



function get_letter(letter) {
	for (var i = 0; i < letters.length; i++) {
		if(letters[i].letter===letter)
		return letters[i]
	}
	console.log('letter "'+letter+'" not found')
	return false
}

</script>
</html>
