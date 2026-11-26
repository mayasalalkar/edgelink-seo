// src/crawlers/htmlCrawler.js
const cheerio = require('cheerio');

/**
 * Step 1: Fetch + Cheerio crawls URL (serverless-compatible crawler).
 * Falls back cleanly if the target URL is unreachable (e.g. demo domain).
 */
async function crawlUrl(url) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; EdgelinkSEOBot/1.0; +https://edgelinktechnology.com)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    const html = await response.text();
    const loadTimeMs = Date.now() - startTime;
    const $ = cheerio.load(html);

    return {
      url,
      finalUrl: response.url || url,
      statusCode: response.status,
      ok: response.ok,
      loadTimeMs,
      contentType: response.headers.get('content-type') || 'text/html',
      server: response.headers.get('server') || null,
      html,
      $,
      crawledLive: true,
    };
  } catch (error) {
    // Graceful fallback so mock/example URLs still run end-to-end
    const fallbackHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Example Dental Clinic | Dentist in Pune</title>
  <meta name="description" content="Dental clinic offering tooth extraction and dental implants in Pune." />
</head>
<body>
  <h1>Welcome to Example Dental Clinic</h1>
  <h2>Our Dental Services</h2>
  <p>We provide comprehensive dental care in Pune including root canals, implants, and extractions.</p>
  <img src="/hero.jpg" />
  <a href="/services">Services</a>
  <a href="/contact">Contact Us</a>
</body>
</html>`;
    const $ = cheerio.load(fallbackHtml);

    return {
      url,
      finalUrl: url,
      statusCode: 0,
      ok: false,
      loadTimeMs: Date.now() - startTime,
      contentType: 'text/html',
      server: null,
      html: fallbackHtml,
      $,
      crawledLive: false,
      crawlError: error?.message || 'Unable to reach URL',
    };
  }
}

module.exports = { crawlUrl };
