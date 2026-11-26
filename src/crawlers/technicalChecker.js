// src/crawlers/technicalChecker.js
/**
 * Step 6: robots.txt + sitemap.xml + HTTPS technical check.
 */
async function safeFetchText(targetUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'EdgelinkSEOBot/1.0' },
    });
    clearTimeout(timeout);
    const text = res.ok ? await res.text() : '';
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: '', error: err?.message || 'Fetch failed' };
  }
}

async function checkTechnical(url, crawlMeta = {}) {
  let origin = url;
  let isHttps = false;
  try {
    const parsed = new URL(url);
    origin = parsed.origin;
    isHttps = parsed.protocol === 'https:';
  } catch {
    isHttps = url.startsWith('https://');
  }

  const robotsUrl = `${origin}/robots.txt`;
  const sitemapUrl = `${origin}/sitemap.xml`;

  const [robotsRes, sitemapRes] = await Promise.all([
    safeFetchText(robotsUrl),
    safeFetchText(sitemapUrl),
  ]);

  const robotsHasDisallowAll = /Disallow:\s*\/\s*$/im.test(robotsRes.text || '');
  const sitemapRefInRobots = (robotsRes.text || '').match(/Sitemap:\s*(\S+)/i)?.[1] || null;

  const sitemapUrlCount = sitemapRes.ok
    ? (sitemapRes.text.match(/<loc>/gi) || []).length
    : 0;

  return {
    isHttps,
    httpStatus: crawlMeta.statusCode ?? null,
    loadTimeMs: crawlMeta.loadTimeMs ?? null,
    crawledLive: Boolean(crawlMeta.crawledLive),
    robotsTxt: {
      url: robotsUrl,
      exists: robotsRes.ok,
      status: robotsRes.status,
      blocksAllCrawlers: robotsHasDisallowAll,
      sitemapReference: sitemapRefInRobots,
    },
    sitemapXml: {
      url: sitemapRefInRobots || sitemapUrl,
      exists: sitemapRes.ok,
      status: sitemapRes.status,
      urlCount: sitemapUrlCount,
    },
  };
}

module.exports = { checkTechnical };
