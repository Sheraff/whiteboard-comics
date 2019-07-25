<!-- ♡ <?php
// PHP HEADER

echo 'php v'.PHP_VERSION . ' ';

if(array_shift((explode(".",$_SERVER['HTTP_HOST'])))==='www'){
	header("HTTP/1.1 301 Moved Permanently");
	header("Location: $base");
	exit();
}   

require 'serve.php';

$graphs = read_tsv();
usort($graphs, function($a, $b) {
	if($a[timestamp] === $b[timestamp]) return 0;
	else return ($a[timestamp] < $b[timestamp]) ? 1 : -1;
});

if($_GET[archives]) {
	echo "give me the menu";
	for($i=0; $i<10; $i++){
		$graphs[$i][content] = file_get_contents($graphs[$i][path]);
	}
	$archives = true;
} else {
	$initial = 0;
	if($_GET[graph]) {
		echo "I know what I want";
		foreach($graphs as $i => $graph) {
			if($graph[name]===$_GET[graph]) {
				$initial = $i;
				break;
			}
		}
	}
	$graphs[$initial][content] = file_get_contents($graphs[$initial][path]);
	if($initial<count($graphs)-1) {
		$graphs[$initial+1][content] = file_get_contents($graphs[$initial+1][path]);
		$next = $graphs[$initial+1][name];
	}
	if($initial>0) {
		$graphs[$initial-1][content] = file_get_contents($graphs[$initial-1][path]);
		$prev = $graphs[$initial-1][name];
	}
}
?> -->

<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Permanent+Marker&display=block">
<link rel="preload" as="worker" href="src/worker.js">

<body>
	<main>
		<aside id="overlay">
			<div class='date'published on><?php echo display_date($graph[timestamp]); ?></div>
			<div class='collab'>
				<span class='credit'><?php echo $graph[credit]."\n"; ?></span>
				<a href="<?php echo $graph[source]; ?>" target="_blank">
					<?php echo $graph[author]."\n"; ?>
				</a>
			</div>
		</aside>

		<section id="graphs">
			<?php 
				$count = count($graphs);
				foreach ($graphs as $index => $graph) 
					article($graph, $index===$initial, $index<$count-10); 
			?>
		</section>
	</main>
	<aside id="meta">
		<header>
			<a href="/">
				<h1><?php echo file_get_contents('./logo/logo.svg'); ?></h1>
				<h2>dope correlations</h2>
			</a>
			<nav id='navigation'>
				<ul>
					<li><a id="archives" href="/archives"><?php echo file_get_contents('/ui/menu.svg'); ?><span>Archives</span></a></li>
					<li><a id="settings" href="#"><?php echo file_get_contents('/ui/settings.svg'); ?><span>Settings</span></a></li>
					<li><a id="previous" href="<?php if($prev) echo '/'.$prev; ?>"><?php echo file_get_contents('/ui/previous.svg'); ?><span>Previous</span></a></li>
					<li><a id="next"     href="<?php if($next) echo '/'.$next; ?>"><?php echo file_get_contents('/ui/next.svg');     ?><span>Next</span></a></li>
				</ul>
			</nav>
		</header>
		<nav id='tags'>
			<ul>
				
			</ul>
		</nav>
		<nav id='settings'>
			<ul>
				
			</ul>
		</nav>
		<div id='blurb'>
			<p>
			<p>
		</div>
		<footer>
			<nav id='menu'>
				<ul>
					<li><a id="facebook"  href="#"><?php echo file_get_contents('./ui/facebook.svg');  ?><span>Facebook</span></a></li>
					<li><a id="instagram" href="#"><?php echo file_get_contents('./ui/instagram.svg'); ?><span>Instagram</span></a></li>
					<li><a id="contact"   href="#"><?php echo file_get_contents('./ui/mail.svg');      ?><span>Contact</span></a></li>
					<li><a id="rss"       href="#"><?php echo file_get_contents('./ui/rss.svg');       ?><span>RSS</span></a></li>
				</ul>
			</nav>
			<nav id='footer'>
				<ul>
					<!-- <li><a href="#">Author</a></li> -->
					<li><a id="author"    href="http://florianpellet.com"><?php echo file_get_contents('./ui/copyright.svg'); ?><span>Florian Pellet</span></a></li>
				</ul>
			</nav>
		</footer>
	</aside>
</body>

<script>const GRAPHS  = (<?php echo json_encode($graphs);  ?>)</script>
<script>const LETTERS = (<?php echo json_encode($letters); ?>)</script>
<script type="module" src="src/script.js"></script>