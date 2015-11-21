<?
	$f_contents = file("../subtitles.txt", FILE_SKIP_EMPTY_LINES | FILE_IGNORE_NEW_LINES); 
  $h2 = $f_contents[rand(0, count($f_contents) - 1)];
  $root = 'http://whiteboard-comics.com';
?>


<rss version="2.0">
<channel>
	<title>Whiteboard</title>
	<description><? echo $h2; ?></description>
	<link><? echo $root; ?></link>


<?
	date_default_timezone_set('America/Los_Angeles');

	function path_to_components($path){
		$name_pieces = explode('-', basename($path), 4);

		$tags = explode('$', substr($name_pieces[3], 0, -4));
		if(count($tags)>1)
			$name = array_shift($tags);
		else{
			$name = $tags[0];
			$tags = false;
		}

		return [
			'path' => $path,
			'name' => $name,
			'release_date_pieces' => [$name_pieces[0], $name_pieces[1], $name_pieces[2]],
			'release_date' => strtotime("$name_pieces[0]-$name_pieces[1]-$name_pieces[2] 8:45:00"),
			'thumbnail' => str_replace(['../', 'graphs/', '.svg', '$'], ['', 'png/', '.png', '#'], $path),
			'formatted_name' => trim( ucwords( preg_replace('/_/', ' ', preg_replace('/,/', ', ', preg_replace('/([=\(\)])/', ' $1 ', $name) ) ) ) ),
			'tags' => $tags
		];
	}

	// get graphs in reverse chronological order
	$globbed = glob("../graphs/*.svg");
	rsort( $globbed );
	
	$count_released = 0;
	foreach ($globbed as $key => $file) {
		$parsed = path_to_components($file);

		// skip the ones that shouldn't be released yet. Release time is at 8:45am Los Angeles time (11:45am NYC, 5:45pm Paris) <=> (before work LA, before lunch NYC, after work Paris)
		if($parsed[release_date] > time())
			continue;

		$count_released++;
		$formatted_date = date('r', $parsed[release_date]);


		echo <<<EOT
	<item>
		<title>$parsed[formatted_name]</title>
		<description>
			<![CDATA[ $parsed[formatted_name] <br/> <img src="$root/$parsed[thumbnail]"> <br/> For an animated version of this image, go to <a href="$root/$parsed[name]">Whiteboard</a> ]]>
    </description>
		<link>$root/$parsed[name]</link>
		<pubDate>$formatted_date</pubDate>
		<guid isPermaLink="true">$root/$parsed[name]</guid>
		<category></category> 
	</item>\n
EOT;

		if($count_released>100)
			break;
	}
?>


</channel>
</rss>