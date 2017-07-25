<meta property="article:author" content="https://facebook.com/florian.pellet" />
<meta property="article:author:first_name" content="Florian" />
<meta property="article:author:last_name" content="Pellet" />
<meta property="article:tag" content="<? echo $archives ? '' : implode('"/><meta property="article:tag" content="', $graphs[$initial_index][tags]); ?>"/>
<meta property="article:published_time" content="<? echo date('c',$graphs[$initial_index][timestamp]); ?>" />
<meta property="og:site_name" content="Whiteboard Comics"/>
<meta name="twitter:description" property="og:description" content="<? echo $archives ? $archive_text : $bites[description]; ?>"/>
<meta name="twitter:image" property="og:image" content="<? echo $base . '/' . $bites[preferred_img]; ?>"/>
<meta property="og:image:url" content="<? echo $base . '/' . $bites[preferred_img]; ?>"/>
<meta property="og:image:width" content="<? echo $bites[img_size][0]; ?>"/>
<meta property="og:image:height" content="<? echo $bites[img_size][1]; ?>"/>
<meta name="twitter:url" property="og:url" content="<? echo $base . '/' . ($archives ? 'archives' : $bites[preferred_img]) ?>"/>
<meta name="twitter:title" property="og:title" content="Whiteboard Comics — <? echo $archives ? 'Archives' : $graphs[$initial_index][formatted_name]; ?>"/>


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
			"url": "<? echo $base; ?>/logo/logo-full.png",
		}
	}
</script>


<!-- DETAILS for this graph -->
<? if(!$archives) { ?><script type="application/ld+json">
	{
		"@context" : "http://schema.org",
		"@type" : "NewsArticle",
		"mainEntityOfPage": {
	    "@type": "WebPage",
	    "@id": "<? echo $base . '/' . $graphs[$initial_index][name]; ?>"
	  },
		"headline" : "<? echo $graphs[$initial_index][formatted_name]; ?>",
		"thumbnail" : "<? echo $base . '/' . $bites[preferred_img]; ?>",
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
				"url": "<? echo $base; ?>/logo/logo-full.png",
			}
		 }
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
	      "item": {
			    "@type": "ImageObject",
			    "url": "<? echo $base . '/' . $graphs[$i][name] . '.gif'; ?>",
					"name": "<? echo $graphs[$i][formatted_name]; ?>",
					"author": {
				    "@type": "Person",
				    "name": "Florian Pellet"
				  },
					"datePublished": "<? echo date('c', $graphs[$i][timestamp]); ?>"
				}
	    },
		<?}
  ?>]
}
</script>
