<?php


function article ($graph, $active=false, $canFeature = false) { 
	$feature = ($canFeature && rand(0,10)===0);
	$classes = ($feature ? "featured " : "") . ($active ? "front start-active" : "");
	?>
	<?php if($active) { ?>
		<svg-card class="placeholder <?php echo ($feature ? "featured " : ""); ?>"></svg-card>
	<?php } ?>
	<svg-card class="<?php echo $classes; ?>">
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
$globbed = glob("alphabet2/result/*.svg");
$letters = array();
foreach ($globbed as $key => $file) {
	if(basename($file) === 'defs.svg')
		continue;
    $letter = str_replace(['alphabet_', '.svg'], '', basename($file));
    $letter = str_replace(
        ['exclamation','question','coma','double','single','period','hashtag','dash','star','plus','equal','multiply','left_p','right_p','left_b','right_b','left_curly','right_curly','and','at','slash','percent','colon'],
        ['!','?',',','"',"'",'.','#','-','*','+','=','×','(',')','[',']','{','}','&','@','/','%',':'],
        $letter
	);
	$letters[$letter] = [
        'content' => file_get_contents($file)
    ];
}
$clips = file_get_contents("alphabet2/result/defs.svg");

?>