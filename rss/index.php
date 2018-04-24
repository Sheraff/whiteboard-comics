<?
	header('Content-Type: application/rss+xml; charset=utf-8');


	$f_contents = file("../subtitles.txt", FILE_SKIP_EMPTY_LINES | FILE_IGNORE_NEW_LINES);
  $h2 = $f_contents[rand(0, count($f_contents) - 1)];
  $root = 'http://whiteboard-comics.com';


?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
	<title>Whiteboard</title>
	<description>This is a blurb I'm supposed to have written explaining how this website is insightful and funny, while still being an ironic side project. A lot of the graphs presented on this website are about my life and relate to procrastination and poor strategic decision making regarding productivity. Sadly, they all contain a grain of personal truth. This is one of the reasons why this blurb is what it is.</description>
	<link><? echo $root; ?></link>
	<atom:link href="<? echo $root; ?>/rss/" rel="self" type="application/rss+xml" />

<?
	// set TIMEZONE
	date_default_timezone_set('America/Los_Angeles');
	$time = time();

	// read METADATA
	$graphs = array();
	$names = [];
	$metadata = str_getcsv(file_get_contents('../graph_list.tsv'), "\n");
	foreach($metadata as $key => &$row){

		// parse
		$row = str_getcsv($row, "\t");
		if($key===0)
			continue;

		// add headers
		$temp = $row;
		$row = [];
		foreach($temp as $key => $item)
			$row[$metadata[0][$key]] = $item;

		// only if published
		$row[timestamp] = strtotime("$row[release] 8:45:00");
		if($row[timestamp] > $time) // TIME. Release time is at 8:45am Los Angeles time (11:45am NYC, 5:45pm Paris)
			continue;

		// metadata
		$row[release] = explode('-', $row[release]);
		$row[path] = "graphs/graphs_$row[name].svg";
		if(file_exists("../gif/$row[name].gif"))
				$row[thumbnail] = "gif/$row[name].gif";
		else if(file_exists("../png/$row[name].png"))
				$row[thumbnail] = "png/$row[name].png";
		else
			$row[thumbnail] = "thumb/graphs_$row[name].png";
		$row[thumb_size] = filesize("../$row[thumbnail]");
		$row[thumb_type] = mime_content_type("../$row[thumbnail]");
		$row[tags] = implode(', ',str_getcsv($row[tags]));
		$row[formatted_name] = trim(htmlspecialchars(preg_replace_callback('/\b[a-zA-Z\s]+/', function($match) {
				return $match[0];
		}, (preg_replace([
			'/_/',
			'/,/',
			'/(≠|=|⋂|→|>|<|×|∅|∪|𝝮)/',
			'/ +/',
		], [
			' ',
			', ',
			' $1 ',
			' ',
		], ucfirst($row[name]))))));
		$row[content] = false;


		if(!in_array($row[name], $names)){
			$graphs[] = $row;
			array_push($names, $row[name]);
		}
	}

	// order graphs // debug: this shouldn't need to happen
	function anti_chronological($a, $b){
		if($a[timestamp]===$b[timestamp])
			return 0;
		return $a[timestamp] > $b[timestamp] ? -1 : 1;
	}
	usort($graphs, 'anti_chronological');

	// output RSS items
	foreach ($graphs as $key => $graph){
		if(!$graph[name]) continue;

		$formatted_date = date('r', $graph[timestamp]);

		// htmlencode
		$graph[formatted_name] = html_entity_decode($graph[formatted_name]);
		// $graph[thumbnail] = urlencode($graph[thumbnail]);
		$graph[encoded_name] = urlencode($graph[name]);

		$graph[encoded_thumbnail] = explode('/', $graph[thumbnail])[0] . '/' . urlencode(explode('/', $graph[thumbnail])[1]);

		// $description = htmlentities("<img src=\"$root/$graph[thumbnail]\">");

		// <enclosure url="$root/$graph[thumbnail]" length="$graph[thumb_size]" type="$graph[thumb_type]" />
		// <![CDATA[ <img src="$root/$graph[thumbnail]"> ]]>


		echo <<<EOT
	<item>
		<title><![CDATA[ $graph[formatted_name] ]]></title>
		<description>
			<![CDATA[
				<img src="$root/$graph[encoded_thumbnail]"><br/>
				<p>See the original version on Whiteboard Comics at <a href="$root/$graph[name]">whiteboard-comics.com/$graph[name]</a>.</p>
				<p>Visit the <a href="$root/archives">archives</a> to find more whiteboard goodness.</p>
				<p>And don't be shy with your *like* on <a href="https://www.facebook.com/existentialWhiteboardComics/">facebook</a>, and feel free to shoot a message if you have any comment, idea, advice, or if you want to publish a book of graphs and make me a gazillionaire.</p>
			]]>
		</description>
		<link>$root/$graph[encoded_name]</link>
		<pubDate>$formatted_date</pubDate>
		<guid isPermaLink="true">$root/$graph[encoded_name]</guid>
		<enclosure url="$root/$graph[encoded_thumbnail]" length="$graph[thumb_size]" type="$graph[thumb_type]" />
		<category>$graph[tags]</category>
	</item>\n
EOT;

		if($key>=100)
			break;
	}
?>


</channel>
</rss>
