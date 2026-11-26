// src/crawlers/dataforseo.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/dataforseo.mock');

/**
 * Step 7: DataForSEO SERP + keyword rankings (MOCKED when USE_MOCKS=true).
 */
async function getDataForSeoRankings(url, keyword = 'dental clinic pune') {
  if (USE_MOCKS) return mockData;

  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.warn('[DataForSEO] Credentials missing; falling back to mock data.');
    return mockData;
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64');
  const response = await fetch(
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          keyword,
          location_name: 'India',
          language_name: 'English',
          depth: 20,
        },
      ]),
    }
  );

  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  let domain = '';
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domain = url;
  }

  const items = data?.tasks?.[0]?.result?.[0]?.items || [];
  const match = items.find((item) => item.domain && item.domain.includes(domain));

  return {
    tasks: data.tasks || [],
    client_rank_position: match?.rank_absolute ?? null,
    keyword_search_volume: data?.tasks?.[0]?.result?.[0]?.se_results_count ?? null,
  };
}

module.exports = { getDataForSeoRankings };
