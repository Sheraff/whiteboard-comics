<!-- ♡ <?php
// PHP HEADER

echo 'php v'.PHP_VERSION . ' ';

if(array_shift((explode(".",$_SERVER['HTTP_HOST'])))==='www'){
	header("HTTP/1.1 301 Moved Permanently");
	header("Location: $base");
	exit();
}   

require 'serve.php';
?> -->

<?php
$graphs = read_tsv();
usort($graphs, function($a, $b) {
	if($a[timestamp] === $b[timestamp]) return 0;
	else return ($a[timestamp] < $b[timestamp]) ? 1 : -1;
});
}
$initial = 0;
?>

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
				foreach ($graphs as $index => $graph) article($graph, $index===$initial, $index<$count-10); ?>
		</section>
	</main>
	<aside id="meta">
		<header>
			<a>
				<h1><?php echo file_get_contents('./logo/logo.svg'); ?></h1>
				<h2>I ♡ correlations!</h2>
			</a>
			<nav id='navigation'>
				<ul>
					<li><a href="#"><?php echo file_get_contents('./UI/menu.svg'); ?><span>Archive</span></a></li>
					<li><a href="#"><?php echo file_get_contents('./UI/settings.svg'); ?><span>Settings</span></a></li>
					<li><a href="#"><?php echo file_get_contents('./UI/previous.svg'); ?><span>Previous</span></a></li>
					<li><a href="#"><?php echo file_get_contents('./UI/next.svg'); ?><span>Next</span></a></li>
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
					<li><a href="#"><?php echo file_get_contents('./UI/rss.svg'); ?><span>RSS</span></a></li>
					<li><a href="#"><?php echo file_get_contents('./UI/facebook.svg'); ?><span>Facebook</span></a></li>
					<li><a href="#"><?php echo file_get_contents('./UI/instagram.svg'); ?><span>Instagram</span></a></li>
					<li><a href="#"><?php echo file_get_contents('./UI/mail.svg'); ?><span>Contact</span></a></li>
				</ul>
			</nav>
			<nav id='footer'>
				<ul>
					<!-- <li><a href="#">Author</a></li> -->
					<li><a href="http://florianpellet.com"><?php echo file_get_contents('./UI/copyright.svg'); ?><span>Florian Pellet</span></a></li>
				</ul>
			</nav>
		</footer>
	</aside>
</body>

<script>const GRAPHS  = (<?php echo json_encode($graphs);  ?>)</script>
<script>const LETTERS = (<?php echo json_encode($letters); ?>)</script>
<script type="module" src="src/script.js"></script>