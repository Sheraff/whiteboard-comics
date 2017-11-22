

<meta property="fb:app_id" content="308404429656811" />

<meta property="og:type" content="article" />
<meta property="article:author" content="https://facebook.com/florian.pellet" />
<!-- <meta property="article:author:first_name" content="Florian" /> -->
<!-- <meta property="article:author:last_name" content="Pellet" /> -->
<meta property="article:tag" content="<? echo $archives ? '' : implode('"/><meta property="article:tag" content="', $graphs[$initial_index][tags]); ?>"/>
<meta property="article:published_time" content="<? echo date('c',$graphs[$initial_index][timestamp]); ?>" />

<meta property="og:site_name" content="Whiteboard Comics"/>
<meta property="og:description" content="<? echo $archives ? $archive_text : $bites[description]; ?>"/>
<meta property="og:url" content="<? echo $base . '/' . ($archives ? 'archives' : $graphs[$initial_index][name]); ?>"/>
<meta property="og:title" content="<? echo $archives ? 'Archives' : $graphs[$initial_index][formatted_name]; ?>"/>

<meta property="og:image" content="<? echo $base . '/' . $bites[preferred_img]; ?>"/>
<meta property="og:image:url" content="<? echo $base . '/' . $bites[preferred_img]; ?>"/>
<meta property="og:image:width" content="<? echo $bites[img_size][0]; ?>"/>
<meta property="og:image:height" content="<? echo $bites[img_size][1]; ?>"/>
<meta property="og:image:type" content="<? echo 'image/' . $bites[preferred_img_type]; ?>"/>
<meta property="og:image:alt" content="An animated graphics plotting the following equation: <? echo $graphs[$initial_index][name]; ?>."/>

<link rel="amphtml" href="<? echo $base.'/amp/'.$graphs[$initial_index][name].'.html'; ?>" />

<meta name="twitter:description" content="<? echo $archives ? $archive_text : $bites[description]; ?>"/>
<meta name="twitter:image" content="<? echo $base . '/' . $bites[preferred_img]; ?>"/>
<meta name="twitter:url" content="<? echo $base . '/' . ($archives ? 'archives' : $bites[preferred_img]) ?>"/>
<meta name="twitter:title" content="Whiteboard Comics — <? echo $archives ? 'Archives' : $graphs[$initial_index][formatted_name]; ?>"/>
