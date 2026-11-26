// scripts/verify-pipeline.js
/**
 * Standalone verification script for mocks, prompt rendering, and PDF fallback generation.
 * Run with: USE_MOCKS=true node scripts/verify-pipeline.js
 */
process.env.USE_MOCKS = 'true';

const assert = require('assert');
const fs = require('fs');
const { USE_MOCKS } = require('../src/mocks');
const { getPageSpeed } = require('../src/crawlers/pagespeed');
const { getGscData } = require('../src/crawlers/gsc');
const { getDataForSeoRankings } = require('../src/crawlers/dataforseo');
const { sendWhatsApp } = require('../src/mocks/twilio.mock');
const { buildMockClaudeResponse } = require('../src/mocks/claude.mock');
const { generateAuditPdf } = require('../src/services/pdfGenerator');

async function main() {
  assert.strictEqual(USE_MOCKS, true, 'USE_MOCKS should be true');

  const ps = await getPageSpeed('https://example-dental-clinic.com');
  assert.strictEqual(ps.categories.performance.score, 0.61);

  const gsc = await getGscData('https://example-dental-clinic.com');
  assert.strictEqual(gsc.totalClicks, 167);
  assert.strictEqual(gsc.rows.length, 5);

  const dfs = await getDataForSeoRankings('https://example-dental-clinic.com');
  assert.strictEqual(dfs.client_rank_position, 4);

  const mockClient = {
    id: 'test-client-1',
    name: 'SmileCare Dental Clinic',
    websiteUrl: 'https://example-dental-clinic.com',
    businessType: 'Dental Clinic',
    city: 'Pune',
    state: 'Maharashtra',
  };

  const signals = {
    onPage: { title: 'Example Dental Clinic', h1Count: 1, wordCount: 420 },
    technical: { isHttps: true, robotsTxt: { exists: true }, sitemapXml: { exists: true } },
    cwv: ps,
    schema: { jsonLdCount: 0, detectedTypes: [] },
    gsc,
    rankings: dfs,
  };

  const claudeOut = buildMockClaudeResponse(mockClient, signals);
  assert.strictEqual(claudeOut.audit_version, 'v1.0');
  assert.ok(claudeOut.overall_score >= 0 && claudeOut.overall_score <= 100);
  assert.ok(Array.isArray(claudeOut.recommendations) && claudeOut.recommendations.length > 0);

  const pdfRes = await generateAuditPdf(mockClient, { id: 'verify-audit-1' }, claudeOut);
  assert.ok(fs.existsSync(pdfRes.pdfPath), 'PDF file should be generated');
  const header = fs.readFileSync(pdfRes.pdfPath).subarray(0, 5).toString('utf8');
  assert.strictEqual(header, '%PDF-', 'Generated file must be a valid PDF');

  const waRes = await sendWhatsApp(mockClient.id, pdfRes.pdfPath, claudeOut.overall_score);
  assert.strictEqual(waRes.status, 'mock_sent');

  console.log('\n✅ All mock integrations, Claude JSON schema, PDF generation, and WhatsApp mock verified!');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
