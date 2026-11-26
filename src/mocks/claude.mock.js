// src/mocks/claude.mock.js
/**
 * Realistic structured JSON mock matching the exact Master SEO Audit Prompt schema
 * (Section 6.2, Pages 12-13) for use when USE_MOCKS=true and no Claude API key is active.
 */
function buildMockClaudeResponse(client, signals) {
  const city = client?.city || 'Pune';
  const businessType = client?.businessType || 'Dental Clinic';
  const url = client?.websiteUrl || 'https://example-dental-clinic.com';
  const lcp = signals?.cwv?.audits?.['largest-contentful-paint']?.displayValue || '4.2 s';
  const unusedJs = signals?.cwv?.audits?.['unused-javascript']?.displayValue || '420 KiB';
  const indexErrors = signals?.gsc?.indexCoverageErrors ?? 3;
  const hasSchema = (signals?.schema?.jsonLdCount || 0) > 0;

  return {
    audit_version: 'v1.0',
    overall_score: 68,
    score_breakdown: {
      technical: 70,
      on_page: 74,
      content: 66,
      core_web_vitals: 61,
      schema: hasSchema ? 72 : 45,
    },
    critical_issues: [
      `Mobile Largest Contentful Paint (LCP) is ${lcp}, well above Google's 2.5 s good threshold.`,
      `Google Search Console reports ${indexErrors} index coverage errors preventing key service pages from ranking.`,
      `Missing or incomplete LocalBusiness / ${businessType} JSON-LD structured data for ${city}.`,
      `420 KiB of unused JavaScript and 2 render-blocking resources delay mobile first render.`,
    ],
    important_issues: [
      `High-intent local query "dental implants cost ${city.toLowerCase()}" ranks at position 11.3 (Page 2) with 3.5% CTR.`,
      `Broad local query "dentist near me" has 2,100 impressions but only 3.2% CTR due to generic meta titles.`,
      `Interaction to Next Paint (INP) at 280 ms sits in the Needs Improvement band (>200 ms).`,
      `XML sitemap and robots.txt directives need explicit canonical alignment and service-page priority.`,
      `Missing location-specific FAQ content targeting common ${city} patient pricing and appointment queries.`,
    ],
    quick_wins: [
      'Defer non-critical JavaScript and inline critical above-the-fold CSS (effort <= 2 hours).',
      `Add complete LocalBusiness + Dentist JSON-LD schema with ${city} NAP, geo-coordinates, and openingHours.`,
      `Rewrite title tags and meta descriptions on top 5 landing pages to include "${city}" and clear call-to-action.`,
      'Preload the hero LCP image in WebP/AVIF format with explicit width and height attributes.',
      `Fix the ${indexErrors} GSC index coverage errors (broken canonicals / 404 redirects) and request re-indexing.`,
    ],
    recommendations: [
      {
        priority: 'CRITICAL',
        category: 'CWV',
        finding: `Mobile LCP is ${lcp} with ${unusedJs} of unused JavaScript and 2 render-blocking resources on ${url}.`,
        fix: 'Convert the hero image to WebP (<100 KiB), add <link rel="preload" as="image">, defer third-party scripts, and remove unused JS bundles.',
        estimated_impact: 'High',
        effort: 'Days',
        falsifiability_check: 'Re-run Mobile PageSpeed Insights; LCP drops below 2.5 s and Performance score exceeds 85.',
      },
      {
        priority: 'CRITICAL',
        category: 'Technical',
        finding: `Google Search Console reports ${indexErrors} index coverage errors blocking crawl budget and local visibility.`,
        fix: 'Inspect the 3 failing URLs in GSC Page Indexing report, resolve 404/noindex conflicts, submit updated sitemap.xml, and click Validate Fix.',
        estimated_impact: 'High',
        effort: 'Hours',
        falsifiability_check: 'GSC Page Indexing report shows 0 coverage errors within 14 days of validation.',
      },
      {
        priority: 'CRITICAL',
        category: 'Schema',
        finding: `Structured data is incomplete for a ${businessType} in ${city}, limiting local pack and rich snippet eligibility.`,
        fix: `Inject valid JSON-LD with @type ["LocalBusiness", "Dentist"], exact NAP, sameAs links, priceRange, areaServed ("${city}"), and FAQPage schema on service pages.`,
        estimated_impact: 'High',
        effort: 'Hours',
        falsifiability_check: 'Google Rich Results Test and Schema Markup Validator report 0 errors and detect LocalBusiness + FAQPage.',
      },
      {
        priority: 'HIGH',
        category: 'OnPage',
        finding: `Queries like "dentist near me" (2,100 impressions, 3.2% CTR) and "dental implants cost ${city.toLowerCase()}" (pos 11.3) underperform on click-through rate.`,
        fix: `Craft benefit-driven title tags (<60 chars) and meta descriptions (<155 chars) featuring ${city} locality names, transparent pricing cues, and appointment booking CTAs.`,
        estimated_impact: 'High',
        effort: 'Hours',
        falsifiability_check: 'Average CTR in GSC for target queries increases from 3.2% to >=5.0% over 30 days.',
      },
      {
        priority: 'HIGH',
        category: 'Content',
        finding: `Service pages lack dedicated transparent pricing and procedure breakdown sections to move "dental implants cost ${city.toLowerCase()}" from position 11.3 to Page 1.`,
        fix: `Publish a dedicated 900-word ${city} treatment & cost guide page with doctor credentials, patient FAQs, and internal links from the homepage.`,
        estimated_impact: 'High',
        effort: 'Days',
        falsifiability_check: 'Target keyword moves into top 5 organic positions in GSC/DataForSEO within 45 days.',
      },
      {
        priority: 'MEDIUM',
        category: 'CWV',
        finding: 'Mobile INP is 280 ms (above the 200 ms good threshold), caused by heavy main-thread JS execution.',
        fix: 'Code-split chat widgets and analytics scripts, loading them on user interaction or idle callback.',
        estimated_impact: 'Medium',
        effort: 'Days',
        falsifiability_check: 'Mobile PageSpeed Insights INP measures <=200 ms and Total Blocking Time drops below 200 ms.',
      },
    ],
    executive_summary: `${client?.name || url} scores 68/100 overall with strong local search demand (4,560 impressions) and a #4 rank for its primary ${city} keyword, but slow mobile LCP (${lcp}), ${indexErrors} index coverage errors, and incomplete LocalBusiness schema are capping patient leads. Fixing mobile performance, structured data, and title/meta CTR on high-impression queries offers the fastest path to top-3 rankings and higher appointment conversions.`,
  };
}

module.exports = { buildMockClaudeResponse };
