// src/crawlers/onPageAnalyzer.js
/**
 * Step 5: On-page SEO analysis.
 * Inspects title, meta description, heading hierarchy, images/alt attributes,
 * canonical URL, viewport, Open Graph tags, internal/external links, and word count.
 */
function analyzeOnPage($, pageUrl) {
  const title = $('title').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const metaRobots = $('meta[name="robots"]').attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
  const viewport = $('meta[name="viewport"]').attr('content')?.trim() || '';
  const htmlLang = $('html').attr('lang')?.trim() || '';

  const h1s = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2s = $('h2')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h3Count = $('h3').length;

  const images = $('img');
  let imagesWithoutAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (!alt || !alt.trim()) imagesWithoutAlt += 1;
  });

  let origin = '';
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    origin = '';
  }

  let internalLinks = 0;
  let externalLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim() || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    if (href.startsWith('/') || (origin && href.startsWith(origin))) {
      internalLinks += 1;
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
      externalLinks += 1;
    }
  });

  const bodyText = $('body').clone().find('script, style, noscript').remove().end().text();
  const words = bodyText
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || '';
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || '';

  const issues = [];
  if (!title) issues.push('Missing <title> tag');
  else if (title.length < 30 || title.length > 65) {
    issues.push(`Title length (${title.length} chars) outside optimal 30-65 char range`);
  }
  if (!metaDescription) issues.push('Missing meta description');
  else if (metaDescription.length < 70 || metaDescription.length > 160) {
    issues.push(`Meta description (${metaDescription.length} chars) outside optimal 70-160 char range`);
  }
  if (h1s.length === 0) issues.push('Missing H1 heading');
  if (h1s.length > 1) issues.push(`Multiple H1 tags found (${h1s.length})`);
  if (!canonical) issues.push('Missing canonical link tag');
  if (!viewport) issues.push('Missing mobile viewport meta tag');
  if (imagesWithoutAlt > 0) issues.push(`${imagesWithoutAlt} image(s) missing alt text`);
  if (words.length < 300) issues.push(`Thin page content (${words.length} words)`);

  return {
    title,
    titleLength: title.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    metaRobots: metaRobots || 'index, follow (default)',
    canonical: canonical || null,
    hasViewport: Boolean(viewport),
    htmlLang: htmlLang || null,
    h1Count: h1s.length,
    h1Tags: h1s.slice(0, 5),
    h2Count: h2s.length,
    h2Tags: h2s.slice(0, 8),
    h3Count,
    totalImages: images.length,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    wordCount: words.length,
    openGraph: {
      hasOgTitle: Boolean(ogTitle),
      hasOgDescription: Boolean(ogDescription),
      hasOgImage: Boolean(ogImage),
    },
    issues,
  };
}

module.exports = { analyzeOnPage };
