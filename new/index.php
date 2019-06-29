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
rsort($graphs);
for($i=0; $i<5; $i++){
	$graphs[$i][content] = file_get_contents($graphs[$i][path]);
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
					<li><a href="#">Prev</a></li>
					<li><a href="#">Next</a></li>
				</ul>
			</nav>
		</header>
		<div>
			<p>
			<p>
		</div>
		<nav id='menu'>
			<ul>
				<li><a href="#">Archive</a></li>
				<li><a href="#">Settings</a></li>
				<li><a href="#">RSS</a></li>
				<li><a href="#">Facebook</a></li>
			</ul>
		</nav>
		<nav id='tags'>
			<ul>
				
			</ul>
		</nav>
		<nav id='settings'>
			<ul>
				
			</ul>
		</nav>
		<footer>
			<nav id='footer'>
				<ul>
					<li><a href="#">Author</a></li>
					<li><a href="#">Contact</a></li>
				</ul>
			</nav>
		</footer>
	</aside>
</body>

<script>const GRAPHS  = (<?php echo json_encode($graphs);  ?>)</script>
<script>const LETTERS = (<?php echo json_encode($letters); ?>)</script>
<script type="module" src="src/script.js"></script>