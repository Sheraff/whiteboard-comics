<?php


function article ($graph, $active=false, $canFeature = false) { ?>
	<svg-card class="<?php echo ($canFeature && rand(0,10)===0 ? "featured " : "") . ($active ? "front start-active" : ""); ?>">
		<?php if($graph[content]) echo $graph[content]; ?>
		<a href="/<?php echo $graph[name]; ?>"></a>
	</svg-card>
<?php }

date_default_timezone_set('America/Los_Angeles');
function read_tsv ($force = false) {
	$metadata = str_getcsv(file_get_contents("./graph_list.tsv"), "\n");
	$metadata[0] = str_getcsv($metadata[0], "\t");
	$time = time();
	$graphs = array();
	foreach($metadata as $key => &$row){
		if($key===0) continue;
		$res = array();
		foreach(str_getcsv($row, "\t") as $key => $item)
			$res[$metadata[0][$key]] = $item;
		$res[timestamp] = strtotime("$res[release] 8:45:00");
		$res[release] = explode('-', $res[release]);
		$res[path] = "graphs/graphs_$res[name].svg";
		$res[tags] = str_getcsv($res[tags]);
		if(file_exists("png/$res[name].png"))
			$res[png] = "png/$res[name].png";
		if(file_exists("gif/$res[name].gif"))
			$res[gif] = "gif/$res[name].gif";
		else {
			// get existing gif images
			$res[frames] = array();
			$existing_imgs = preg_grep("/png\/temp\/".preg_quote($res[name], '/').".*s\.png/", glob("png/temp/*.png"));
			foreach ($existing_imgs as $key => $file) {
				array_push($res[frames], intval(array_slice(explode('-', explode('.',$file)[0]), -2, 1)[0]));
			}
		}
		$res[formatted_name] = trim(htmlspecialchars(preg_replace_callback('/\b[a-zA-Z\s]+/', function($match) {
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
		], ucfirst($res[name]))))));
		$res[content] = false;

		if(file_exists("./$res[path]") && ($force===true || $res[name]===$force || $res[timestamp] < $time)){
			$graphs[] = $res;
		}
	}
	return $graphs;
}

function display_date ($timestamp) {
	return date('F jS, Y', $timestamp);
}

// grab ALPHABET
$globbed = glob("alphabet/*.svg");
$letters = array();
foreach ($globbed as $key => $file) {
    $letter = str_replace(['alphabet_', '.svg'], '', basename($file));
    $letter = str_replace(
        ['exclamation','question','coma','double','single','period','hashtag','dash','star','plus','equal','multiply','left_p','right_p','left_b','right_b','left_curly','right_curly','and','at','slash','percent','colon'],
        ['!','?',',','"',"'",'.','#','-','*','+','=','×','(',')','[',']','{','}','&','@','/','%',':'],
        $letter
    );
    $letters[$letter] = [
        'content' => format_alphabet(file_get_contents($file))
    ];
}

function format_alphabet($string){
    $string = preg_replace([
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