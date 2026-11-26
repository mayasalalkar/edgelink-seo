// src/crawlers/gsc.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/gsc.mock');

/**
 * Step 3: Google Search Console API (MOCKED when USE_MOCKS=true).
 */
async function getGscData(url) {
  if (USE_MOCKS) return mockData;

  const accessToken = process.env.GSC_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn('[GSC] No GSC_ACCESS_TOKEN set; falling back to mock data.');
    return mockData;
  }

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const encodedSite = encodeURIComponent(url);

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 10,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const rows = (json.rows || []).map((r) => ({
    query: r.keys?.[0] || '',
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Number((r.ctr || 0).toFixed(3)),
    position: Number((r.position || 0).toFixed(1)),
  }));

  return {
    rows,
    totalClicks: rows.reduce((sum, r) => sum + r.clicks, 0),
    totalImpressions: rows.reduce((sum, r) => sum + r.impressions, 0),
    indexCoverageErrors: 0,
  };
}

module.exports = { getGscData };
