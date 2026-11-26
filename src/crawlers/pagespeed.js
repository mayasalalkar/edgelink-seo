// src/crawlers/pagespeed.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/pagespeed.mock');

/**
 * Step 2: Google PageSpeed Insights API (MOCKED when USE_MOCKS=true).
 */
async function getPageSpeed(url) {
  if (USE_MOCKS) return mockData;

  const apiKey = process.env.PAGESPEED_API_KEY;
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.append('category', 'performance');
  endpoint.searchParams.append('category', 'seo');
  endpoint.searchParams.append('category', 'accessibility');
  if (apiKey) endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint.toString());
  if (!response.ok) {
    throw new Error(`PageSpeed API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const lr = data.lighthouseResult || {};

  return {
    url,
    strategy: 'mobile',
    categories: {
      performance: { score: lr.categories?.performance?.score ?? 0 },
      seo: { score: lr.categories?.seo?.score ?? 0 },
      accessibility: { score: lr.categories?.accessibility?.score ?? 0 },
    },
    audits: {
      'largest-contentful-paint': {
        score: lr.audits?.['largest-contentful-paint']?.score ?? 0,
        displayValue: lr.audits?.['largest-contentful-paint']?.displayValue || 'N/A',
      },
      'cumulative-layout-shift': {
        score: lr.audits?.['cumulative-layout-shift']?.score ?? 0,
        displayValue: lr.audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
      },
      'interaction-to-next-paint': {
        score: lr.audits?.['interaction-to-next-paint']?.score ?? 0,
        displayValue: lr.audits?.['interaction-to-next-paint']?.displayValue || 'N/A',
      },
      'render-blocking-resources': {
        score: lr.audits?.['render-blocking-resources']?.score ?? 0,
        description: lr.audits?.['render-blocking-resources']?.displayValue || 'N/A',
      },
      'unused-javascript': {
        score: lr.audits?.['unused-javascript']?.score ?? 0,
        displayValue: lr.audits?.['unused-javascript']?.displayValue || 'N/A',
      },
    },
  };
}

module.exports = { getPageSpeed };
