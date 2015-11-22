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
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 807 438" enable-background="new 0 0 807 438" xml:space="preserve">
 <path stroke="#FFFFFF" stroke-width="120" d="M491,21.7 c-43.1,5-86.6,0-129.9-0.2s-88.4,4.9-125.3,27.8c-23,14.3-41.5,34.7-59.7,54.8c-33.6,37.3-67.2,74.5-100.8,111.8 C57.5,235.7,39,256.7,33,282.7c24.4,3.4,44.6-17.8,60.1-37c40.5-49.8,82.4-99.3,133.7-137.8s113.5-65.5,177.6-64.4 c8.6,0.2,18.8,1.9,22.4,9.7c5.2,11.1-7.5,21.9-18.2,27.9c-99.1,54.6-192.9,118.7-279.9,191.1c-13.4,11.2-28,28.3-20,43.8 c5.4,10.5,19.5,14,30.9,11c11.4-3,20.9-10.9,30-18.4c72.1-59.6,150.7-111.2,233.9-153.8c-43.1,78.9-125.7,126-195.6,182.7 c-9.4,7.7-19,16-23.5,27.3c-4.5,11.3-2.1,26.3,8.5,32.3c14.2,8.1,31.2-3.9,43.1-15.2c89.1-84.4,178.2-168.8,267.4-253.1 c14.1,31.9-5.8,68.4-28.8,94.6c-23,26.2-51.2,51.5-57,85.9c27.5,3.9,54-13.4,71.4-35.1c17.4-21.6,28.2-47.7,43.6-70.8 c15.3-23.1,37.4-44.4,64.9-47.9c-27.5,41.8-55.7,85.6-61.3,135.3c79.5-29.9,166.5-39.4,250.6-27.5c4.5,0.6,9.5,1.7,11.8,5.5 c2.8,4.4,0.3,10.6-3.9,13.7s-9.6,3.9-14.8,4.6c-24.8,3.4-49.6,6.7-74.5,10.1c-17.1,2.3-35.7,4.4-50.7-4.2 c-15-8.6-21.7-32.6-7.9-43.1"/>
 <path stroke-width="7" d="M221.7,391.2"/>
 <g>
 <line stroke-width="7" x1="219.5" y1="415" x2="219.5" y2="82"/>
 <line stroke-width="7" x1="44" y1="267.5" x2="412" y2="267.5"/>
 <polyline stroke-width="7" points=" 197,104 219.5,82 242,104 	"/>
 <polyline stroke-width="7" points=" 390,245 412,267.5 390,290 	"/>
 </g>
 <g>
 <text transform="matrix(1 0 0 1 197.0029 32.1329)">
	 <tspan x="0" y="0" font-family="'PermanentMarker'" font-size="31">how good i think </tspan>
	 <tspan x="0" y="37.2" font-family="'PermanentMarker'" font-size="31">i am at something</tspan>
 </text>

 </g>
 <g>
 <text transform="matrix(1 0 0 1 422.0029 256.5414)">
	 <tspan x="0" y="0" font-family="'PermanentMarker'" font-size="31">how good i think</tspan>
	 <tspan x="0" y="37.2" font-family="'PermanentMarker'" font-size="31">people are at something</tspan>
 </text>

 </g>
 <g>
 <text transform="matrix(1 0 0 1 242.0913 156.7453)" fill="#FF931E" font-family="'PermanentMarker'" font-size="31">how good i actually am</text>

 </g>
 <path stroke="#FF931E" stroke-width="7" d="M220,266c14-5,30-24,24-39 c-15-36-55-3-62,19c-20,59,70,81,99,32c22-36,1-65-34-80c-23-10-63-20-83-1c-17,16-21,52-20,74c3,38,40,67,76,75 c69,16,127-61,128-125c2-80-110-125-178-117c-72,9-81,98-78,157c3,62,54,104,113,113c76,11,148-36,178-106"/>
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


rewrite_with_paths(document.getElementsByTagName('svg')[0])

function rewrite_with_paths(svg) {
	var texts = svg.getElementsByTagName('text')

	for (var text_pointer = 0; text_pointer < texts.length; text_pointer++) {
		var text = texts[text_pointer]

		if(text.getAttribute('id')==='watermark')
			continue

		var tspans = text.getElementsByTagName('tspan')
		if(tspans.length===0){
			replace_span(text)
		} else {
			for (var i = 0; i < tspans.length; i++) {
				replace_span(tspans[i])
			}
		}
	}

	function replace_span(reference_element) {
		if(reference_element.childNodes.length>1 || reference_element.childNodes[0].nodeType!==3){
			console.log(reference_element.childNodes)
			return console.log('this node still has children')
		}

		var is_tspan = reference_element.tagName.toLowerCase()==='tspan'

		var text_position = is_tspan ? reference_element.parentElement.getAttribute('transform') : reference_element.getAttribute('transform')
		text_position = text_position.slice(7,-1).split(' ')
		text_position = {
			x: parseFloat(text_position[4]),
			y: parseFloat(text_position[5])
		}
		if(is_tspan){
				text_position.x += parseFloat(reference_element.getAttribute('x'))
				text_position.y += parseFloat(reference_element.getAttribute('y'))
		}

		var color = reference_element.getAttribute('fill')
		if(!color)
			color = is_tspan ? reference_element.parentElement.getAttribute('fill') : false

		var sentence = reference_element.childNodes[0].nodeValue
		var insert_at = is_tspan ? reference_element.parentElement : reference_element
		var char_pointer = 0
		var x_length = 0
		for (var char_pointer = 0; char_pointer < sentence.length; char_pointer++) {
			if(sentence[char_pointer]===' '){
				x_length+=10
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
				if(color)
					paths[i].setAttribute('stroke', color)
				insert_at.parentNode.insertBefore(paths[i], insert_at)
			}
			x_length += letter.viewbox.width + .5
		}
		reference_element.style.display = 'none'
	}

	function get_letter(letter) {
		for (var i = 0; i < letters.length; i++) {
			if(letters[i].letter===letter)
			return letters[i]
		}
		console.log('letter "'+letter+'" not found')
		return false
	}
}

</script>
</html>
