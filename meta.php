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
<link rel="amphtml" href="<? echo $base.'/amp/'.$graphs[$initial_index][name].'.html'; ?>" />
