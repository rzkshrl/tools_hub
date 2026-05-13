// ============================================================
// TOOLS HUB — Google Apps Script
// Satu project, banyak tools, navigasi tanpa reload
// Deploy: Execute as Me | Anyone can access
// ============================================================


// doGet selalu return index.html (SPA shell)
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Tools Hub')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// Dipanggil oleh SPA client untuk load konten tool
// Memproses HTML file agar aman di-inject ke DOM (style + ext scripts + body)
function getPageHtml(page) {
  var pageMap = {
    'konversi-satuan':  'konversi_satuan_index',
    'collect-db':       'collect_db_index',
    'stock-matcher':    'stock_name_matcher_index',
    'panduan-konversi': 'panduan_konversi',
  };
  var file = pageMap[page];
  if (!file) return null;

  var raw = HtmlService.createHtmlOutputFromFile(file).getContent();
  return processToolHtml_(raw);
}

// Ekstrak <style>, ext <script src>, dan <body> content
// agar aman di-inject via innerHTML (browser drop <head> jika nested)
function processToolHtml_(html) {
  // Ambil semua blok <style>
  var styleMatches = [];
  var styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  var m;
  while ((m = styleRe.exec(html)) !== null) {
    styleMatches.push(m[1]);
  }
  var styleBlock = styleMatches.length
    ? '<style>' + styleMatches.join('\n') + '</style>'
    : '';

  // Ambil semua external script src dari <head>
  var extSrcs = [];
  var headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    var headHtml = headMatch[1];
    var extRe = /<script[^>]+src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
    while ((m = extRe.exec(headHtml)) !== null) {
      extSrcs.push(m[1]);
    }
  }
  var extBlock = extSrcs.map(function(src) {
    return '<script src="' + src + '"></script>';
  }).join('\n');

  // Ambil konten <body>
  var bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  var bodyContent = bodyMatch ? bodyMatch[1].trim() : html;

  return styleBlock + '\n' + extBlock + '\n' + bodyContent;
}