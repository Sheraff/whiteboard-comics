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
	// set TIMEZONE
	date_default_timezone_set('America/Los_Angeles');
	$time = time();

	// read METADATA
	$graphs = array();
	$metadata = str_getcsv(file_get_contents('../graph_list.tsv'), "\n");
	foreach($metadata as $key => &$row){
		$row = str_getcsv($row, "\t");
		if($key===0)
			continue;
		$temp = $row;
		$row = [];
		foreach($temp as $key => $item)
			$row[$metadata[0][$key]] = $item;
		$row[timestamp] = strtotime("$row[release] 8:45:00");
		$row[release] = explode('-', $row[release]);
		$row[path] = "graphs/graphs_$row[name].svg";
		$row[thumbnail] = "png/$row[name].png";
		$row[tags] = str_getcsv($row[tags]);
		$row[formatted_name] = trim( ucwords( preg_replace('/_/', ' ', preg_replace('/,/', ', ', preg_replace('/([=\(\)])/', ' $1 ', $row[name]) ) ) ) );
		$row[content] = false;
		if($row[timestamp] < $time) // TIME. Release time is at 8:45am Los Angeles time (11:45am NYC, 5:45pm Paris)
			$graphs[] = $row;
	}

	// order graphs // debug: this shouldn't need to happen
	function anti_chronological($a, $b){
		if($a[timestamp]===$b[timestamp])
			return 0;
		return $a[timestamp] > $b[timestamp] ? -1 : 1;
	}
	usort($graphs, 'anti_chronological');

	// try and MATCH graph to query
	foreach ($graphs as $key => $graph){
		$formatted_date = date('r', $graph[timestamp]);


		echo <<<EOT
	<item>
		<title>$graph[formatted_name]</title>
		<description>
			<![CDATA[ <img src="$root/$graph[thumbnail]"> <br/> For an animated version of this image, go to <a href="$root/$graph[name]">whiteboard-comics.com</a> ]]>
    </description>
		<link>$root/$graph[name]</link>
		<pubDate>$formatted_date</pubDate>
		<guid isPermaLink="true">$root/$graph[name]</guid>
		<category></category>
	</item>\n
EOT;

		if($key>100)
			break;
	}
?>


</channel>
</rss>
