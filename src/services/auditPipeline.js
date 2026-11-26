// src/services/auditPipeline.js
const { prisma } = require('../lib/prisma');
const { crawlUrl } = require('../crawlers/htmlCrawler');
const { getPageSpeed } = require('../crawlers/pagespeed');
const { getGscData } = require('../crawlers/gsc');
const { validateSchema } = require('../crawlers/schemaValidator');
const { analyzeOnPage } = require('../crawlers/onPageAnalyzer');
const { checkTechnical } = require('../crawlers/technicalChecker');
const { getDataForSeoRankings } = require('../crawlers/dataforseo');
const { analyzeWithClaude } = require('./claudeAnalyzer');
const { generateAuditPdf } = require('./pdfGenerator');
const { dispatchNotifications } = require('./notifier');

async function updateProgress(auditId, progress, currentStep, extraData = {}) {
  return prisma.audit.update({
    where: { id: auditId },
    data: {
      progress,
      currentStep,
      ...extraData,
    },
  });
}

/**
 * Executes the exact sequential Audit Job Pipeline (Section 3.2, Page 8):
 *   Step 1: Fetch + Cheerio crawls URL
 *   Step 2: PageSpeed Insights API (MOCKED)
 *   Step 3: Google Search Console (MOCKED)
 *   Step 4: Schema.org validator
 *   Step 5: On-page analysis
 *   Step 6: robots.txt + sitemap.xml check
 *   Step 7: DataForSEO rankings (MOCKED)
 *   Step 8: Claude API -> structured JSON recommendations (REAL or MOCK)
 *   Step 9: Postgres store audit result
 *   Step 10: PDF Report Generator (Puppeteer -> /tmp/reports/)
 *   Step 11: Twilio WhatsApp + Email -> console.log mock + DB notification log
 */
async function runAuditPipeline(auditId) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { client: true },
  });

  if (!audit) {
    throw new Error(`Audit ${auditId} not found.`);
  }

  const { client } = audit;

  try {
    await updateProgress(auditId, 5, 'Starting audit worker', { status: 'RUNNING' });

    // Step 1: Fetch + Cheerio crawls URL
    await updateProgress(auditId, 15, 'Step 1/7: Crawling website HTML (Fetch + Cheerio)');
    const crawl = await crawlUrl(client.websiteUrl);

    // Step 2: PageSpeed Insights API (MOCKED)
    await updateProgress(auditId, 25, 'Step 2/7: Fetching PageSpeed Insights (CWV)');
    const cwv = await getPageSpeed(client.websiteUrl);

    // Step 3: Google Search Console (MOCKED)
    await updateProgress(auditId, 35, 'Step 3/7: Fetching Google Search Console metrics');
    const gsc = await getGscData(client.websiteUrl);

    // Step 4: Schema.org validator
    await updateProgress(auditId, 45, 'Step 4/7: Validating Schema.org structured data');
    const schema = validateSchema(crawl.$);

    // Step 5: On-page analysis
    await updateProgress(auditId, 55, 'Step 5/7: Running on-page SEO analysis');
    const onPage = analyzeOnPage(crawl.$, client.websiteUrl);

    // Step 6: robots.txt + sitemap.xml check
    await updateProgress(auditId, 65, 'Step 6/7: Checking robots.txt & sitemap.xml');
    const technical = await checkTechnical(client.websiteUrl, {
      statusCode: crawl.statusCode,
      loadTimeMs: crawl.loadTimeMs,
      crawledLive: crawl.crawledLive,
    });

    // Step 7: DataForSEO rankings (MOCKED)
    await updateProgress(auditId, 75, 'Step 7/7: Fetching DataForSEO keyword rankings');
    const primaryKeyword = `${client.businessType.toLowerCase()} ${client.city.toLowerCase()}`;
    const rankings = await getDataForSeoRankings(client.websiteUrl, primaryKeyword);

    const signals = {
      onPage,
      technical,
      cwv,
      schema,
      gsc,
      rankings,
      crawlMeta: {
        finalUrl: crawl.finalUrl,
        statusCode: crawl.statusCode,
        loadTimeMs: crawl.loadTimeMs,
        crawledLive: crawl.crawledLive,
      },
    };

    // Step 8: Claude API analysis -> structured JSON
    await updateProgress(auditId, 85, 'Analysing signals with Claude API (claude-sonnet-4-6)', {
      signals,
    });
    const result = await analyzeWithClaude(client, signals);

    // Step 9: Store structured audit result in Postgres
    await updateProgress(auditId, 90, 'Saving structured audit result to Postgres', {
      overallScore: result.overall_score,
      scoreBreakdown: result.score_breakdown,
      result,
    });

    // Step 10: PDF Report Generator (Puppeteer -> /tmp/reports/)
    await updateProgress(auditId, 95, 'Generating PDF audit report (Puppeteer)');
    const { pdfPath } = await generateAuditPdf(client, audit, result);

    // Step 11: Twilio WhatsApp + Email mock delivery
    await updateProgress(auditId, 98, 'Delivering report via WhatsApp & Email', { pdfPath });
    await dispatchNotifications(client, auditId, pdfPath, result.overall_score);

    const completedAudit = await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        currentStep: 'Completed',
        pdfPath,
        completedAt: new Date(),
      },
      include: {
        client: true,
        notifications: true,
      },
    });

    console.log(
      `[PIPELINE] Audit ${auditId} completed for ${client.name} — Score: ${result.overall_score}/100`
    );
    return completedAudit;
  } catch (err) {
    console.error(`[PIPELINE] Audit ${auditId} failed:`, err);
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'FAILED',
        currentStep: 'Failed',
        errorMessage: err?.message || 'Unknown pipeline error',
      },
    });
    throw err;
  }
}

module.exports = { runAuditPipeline };
