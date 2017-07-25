<? echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>http://whiteboard-comics.com/archives</loc>
    <changefreq>weekly</changefreq>
  </url>
<?
  require '../php_utils.php';
  $graphs = read_metadata(false, '..');
  foreach ($graphs as $key => $graph) {
    $bites = extra_content($key, $graphs, '..');
?>
  <url>
    <loc><? echo "http://whiteboard-comics.com/$graph[name]"; ?></loc>
    <news:news>
      <news:publication>
        <news:name>Whiteboard Comics</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:genres>Satire</news:genres>
      <news:publication_date><? echo implode('-',$graph[release]); ?></news:publication_date>
      <news:title><? echo $graph[formatted_name]; ?></news:title>
      <news:keywords><? echo implode(', ',$graph[tags]); ?></news:keywords>
    </news:news>
    <image:image>
       <image:loc><? echo "http://whiteboard-comics.com/$graph[name].gif"; ?></image:loc>
       <image:caption><? echo $bites[description]; ?></image:caption>
    </image:image>
  </url>
<?
  }
?>
</urlset>
