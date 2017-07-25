<!-- DETAILS name of website -->
<script type="application/ld+json">
	{
	  "@context": "http://schema.org",
	  "@type": "WebSite",
	  "name": "Whiteboard Comics",
	  "url": "http://whiteboard-comics.com"
	}
</script>


<!-- DETAILS for Whiteboard Comics in general -->
<script type="application/ld+json">
	{
		"@context" : "http://schema.org",
		"@type" : "Organization",
		"name" : "Whiteboard Comics",
		"url" : "<? echo $base; ?>",
		"sameAs" : [
			"https://www.facebook.com/existentialWhiteboardComics"
		],
		"logo": {
			"@type": "ImageObject",
			"url": "<? echo $base; ?>/logo/logo-full.png"
		}
	}
</script>


<!-- DETAILS for this graph -->
<? if(!$archives) { ?><script type="application/ld+json">
	{
		"@context" : "http://schema.org",
		"@type" : "NewsArticle",
		"mainEntityOfPage": "<? echo $base . '/' . $graphs[$initial_index][name]; ?>",
		"headline" : "<? echo $graphs[$initial_index][formatted_name]; ?>",
		"image": {
	    "@type": "ImageObject",
	    "url": "<? echo $base . '/' . $bites[preferred_img]; ?>",
	    "height": <? echo $bites[img_size][1]; ?>,
	    "width": <? echo $bites[img_size][0]; ?>
	  },
		"author": {
	    "@type": "Person",
	    "name": "Florian Pellet"
	  },
		"publisher": {
			"@type" : "Organization",
			"name" : "Whiteboard Comics",
			"url" : "<? echo $base; ?>",
			"sameAs" : [
				"https://www.facebook.com/existentialWhiteboardComics"
			],
			"logo": {
				"@type": "ImageObject",
				"url": "<? echo $base; ?>/logo/logo-full.png"
			}
		},
		"datePublished" : "<? echo date('c', $graphs[$initial_index][timestamp]); ?>",
		"description" : "<? echo $bites[description]; ?>"
	}
</script><?}?>


<!-- DETAILS list of graphs -->
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "ItemList",
  "itemListElement": [<?
		for ($i=0; $i < 10; $i++) {
			?>{
	      "@type": "ListItem",
	      "position": "<? echo $i; ?>",
				"url": "<? echo $base . '/' . $graphs[$i][name];?>"
	    }<? if($i<9) echo ','; ?>
		<?}
  ?>]
}
</script>
