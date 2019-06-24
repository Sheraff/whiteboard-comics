<!-- ♡ <?
// PHP HEADER

echo 'php v'.PHP_VERSION . ' ';

if(array_shift((explode(".",$_SERVER['HTTP_HOST'])))==='www'){
	header("HTTP/1.1 301 Moved Permanently");
	header("Location: $base");
	exit();
}   

require 'serve.php';
?> -->

<?
$graphs = read_tsv();
rsort($graphs);
for($i=0; $i<5; $i++){
	$graphs[$i][content] = file_get_contents($graphs[$i][path]);
}
$initial = 0;
?>

<link rel="stylesheet" href="style.css">
<link href="https://fonts.googleapis.com/css?family=Permanent+Marker&display=block" rel="stylesheet">
<link href="./worker.js" rel="prefetch" as="worker">

<body>
	<main>
		<aside>
			<div class='date'published on><? echo display_date($graph[timestamp]); ?></div>
			<div class='collab'>
				<span class='credit'><? echo $graph[credit]."\n"; ?></span>
				<a href="<? echo $graph[source]; ?>" target="_blank">
					<? echo $graph[author]."\n"; ?>
				</a>
			</div>
		</aside>

		<section>
			<? foreach ($graphs as $index => $graph) article($graph, $index===$initial); ?>
		</section>
	</main>
	<aside>
		<header>
			<a>
				<h1><? echo file_get_contents('./logo/logo.svg'); ?></h1>
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

<script>const GRAPHS  = (<? echo json_encode($graphs);  ?>)</script>
<script>const LETTERS = (<? echo json_encode($letters); ?>)</script>
<script src="script.js"></script>