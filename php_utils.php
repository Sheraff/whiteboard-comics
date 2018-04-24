<?
	// set TIMEZONE
	date_default_timezone_set('America/Los_Angeles');


	function anti_chronological($a, $b){
		if($a[timestamp]===$b[timestamp])
			return 0;
		return $a[timestamp] > $b[timestamp] ? -1 : 1;
	}

	function read_metadata($master, $dir='.', $name=''){
		$time = time();
		$graphs = array();
		$metadata = str_getcsv(file_get_contents("$dir/graph_list.tsv"), "\n");
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
			if(file_exists("png/$row[name].png"))
				$row[watermarked] = "png/$row[name].png";
			if(file_exists("gif/$row[name].gif"))
				$row[gif] = "gif/$row[name].gif";
			else {
				// get existing gif images
				$row[gif_images] = array();
				$existing_imgs = preg_grep("/png4gif\/".preg_quote($row[name], '/').".*\.png/", glob("png4gif/*.png"));
				foreach ($existing_imgs as $key => $file) {
					array_push($row[gif_images], intval(array_slice(explode('-', explode('.',$file)[0]), -2, 1)[0]));
				}
			}
			$row[thumbnail] = $row[watermarked] ? $row[watermarked] : "thumb/graphs_$row[name].png";
			$row[tags] = str_getcsv($row[tags]);
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

			if(file_exists("$dir/$row[path]") && ($row[name]===$name || $row[timestamp] < $time || $master)){ // TIME. Release time is at 8:45am Los Angeles time (11:45am NYC, 5:45pm Paris)
				$graphs[] = $row;
			}
		}
		// order graphs // debug: this shouldn't need to happen
		usort($graphs, 'anti_chronological');
		foreach ($graphs as $id => &$graph) {
			$graph[id] = $id;
		}
		return $graphs;
	}

	function extra_content ($index, $graphs, $dir='.'){
		$extra_content = [];
		// links
		$extra_content[prev_page] = $index===0 ? '/' : $graphs[$index-1][name];
		$extra_content[next_page] = $index===count($graphs)-1 ? '/' : $graphs[$index+1][name];
		// h2 subtitle
		$f_contents = file("$dir/subtitles.txt", FILE_SKIP_EMPTY_LINES | FILE_IGNORE_NEW_LINES);
		$extra_content[h2] = $f_contents[rand(0, count($f_contents) - 1)];
		// tags
		$extra_content[meta_tags_list] = implode(", ", $graphs[$index][tags]);
		$extra_content[readable_tags_list] = '';
		if(count($graphs[$index][tags])===1)
			$extra_content[readable_tags_list] = $graphs[$index][tags][0];
		else
			foreach ($graphs[$index][tags] as $key => $tag){
				$extra_content[readable_tags_list] .= strlen($extra_content[readable_tags_list])===0?'':($key===(count($graphs[$index][tags])-1)?' and ':', ');
				$extra_content[readable_tags_list] .= $tag;
			}
		// description
		$extra_content[description] = "Graph about $extra_content[readable_tags_list]. Drawn by Whiteboard Comics".($graphs[$index][author]?', '.$graphs[$index][credit].' '.$graphs[$index][author]:'').'. And don\'t forget: '.$extra_content[h2].'.';
		//image
		$extra_content[preferred_img] = isset($graphs[$index][gif]) ? $graphs[$index][gif] : (isset($graphs[$index][watermarked]) ? $graphs[$index][watermarked] : $graphs[$index][thumbnail]);
		$extra_content[preferred_img_type] = isset($graphs[$index][gif]) ? 'gif' : 'png';
		$extra_content[img_size] = getimagesize($dir.'/'.$extra_content[preferred_img]);
		return $extra_content;
	}

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
			'/PermanentMarker/',
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
			"Permanent Marker', 'PermanentMarker",
			' ',
			'd="M'
		], $string);
		return $string;
	}

	function format_alphabet($string){
		$string = preg_replace([
			'/<\?xml.*?>/',
			'/<!--.*?-->/',
			'/<!DOCTYPE.*?>/',
			'/<svg.*?viewBox="(([0-9\.]+ ?){4})".*?>/',
			'/ ?stroke-linejoin="round" ?/',
			'/ ?stroke-linejoin="bevel" ?/',
			'/ ?stroke-linecap="round" ?/',
			'/ ?stroke-width="4" ?/',
			'/ ?fill="none" ?/',
			'/ ?stroke="#(0[0-1]){3}" ?/',
			'/ ?stroke-miterlimit="10" ?/',
			'/ +/',
			'/d=" M/'
		], [
			' ',
			' ',
			' ',
			'<svg viewBox="$1">',
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

	// add blank index.php files to all directories to prevent listings
	recurse(".");
	function recurse($path){
			foreach(scandir($path) as $o){
					if($o != "." && $o != ".."){
							$full = $path . "/" . $o;
							if(is_dir($full)){
									if(!file_exists($full . "/index.php") && !file_exists($full . "/index.html")){
											file_put_contents($full . "/index.php", "");
									}
									recurse($full);
							}
					}
			}
	}
?>
