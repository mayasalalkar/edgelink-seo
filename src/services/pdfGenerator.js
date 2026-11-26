// src/services/pdfGenerator.js
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = process.env.REPORTS_DIR || '/tmp/reports';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportHtml(client, audit, result) {
  const breakdown = result.score_breakdown || {};
  const scoreColor =
    result.overall_score >= 80 ? '#059669' : result.overall_score >= 60 ? '#d97706' : '#dc2626';

  const recRows = (result.recommendations || [])
    .map(
      (rec) => `
      <tr>
        <td><span class="badge badge-${escapeHtml(String(rec.priority || 'LOW').toLowerCase())}">${escapeHtml(rec.priority)}</span></td>
        <td><strong>${escapeHtml(rec.category)}</strong></td>
        <td>
          <div><strong>Finding:</strong> ${escapeHtml(rec.finding)}</div>
          <div style="margin-top:4px;"><strong>Fix:</strong> ${escapeHtml(rec.fix)}</div>
          <div style="margin-top:4px;color:#475569;font-size:11px;"><strong>Verify:</strong> ${escapeHtml(rec.falsifiability_check)}</div>
        </td>
        <td>${escapeHtml(rec.estimated_impact)}</td>
        <td>${escapeHtml(rec.effort)}</td>
      </tr>`
    )
    .join('');

  const listItems = (arr) =>
    (arr || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>None reported.</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>SEO Audit Report — ${escapeHtml(client.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.5; padding: 32px; font-size: 12px; }
    .header { background: #047857; color: #ffffff; padding: 24px 28px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { font-size: 22px; margin-bottom: 4px; }
    .header p { font-size: 12px; opacity: 0.9; }
    .score-box { background: #ffffff; color: ${scoreColor}; border-radius: 10px; padding: 12px 20px; text-align: center; min-width: 110px; }
    .score-box .num { font-size: 32px; font-weight: 800; line-height: 1; }
    .score-box .lbl { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
    .section { margin-bottom: 22px; }
    .section h2 { font-size: 14px; color: #047857; border-bottom: 2px solid #d1fae5; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    .summary { background: #f8fafc; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 12.5px; }
    .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .metric { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
    .metric .val { font-size: 20px; font-weight: 700; color: #0f172a; }
    .metric .key { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .card h3 { font-size: 12px; margin-bottom: 8px; }
    .card ul { padding-left: 16px; }
    .card li { margin-bottom: 5px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 700; color: #334155; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #e2e8f0; color: #334155; }
    .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>SEO Automation Audit Report</h1>
      <p><strong>${escapeHtml(client.name)}</strong> • ${escapeHtml(client.websiteUrl)}</p>
      <p>${escapeHtml(client.businessType)} • ${escapeHtml(client.city)}, ${escapeHtml(client.state)}, India • Audit ID: ${escapeHtml(audit.id)}</p>
    </div>
    <div class="score-box">
      <div class="num">${escapeHtml(result.overall_score)}</div>
      <div class="lbl">Overall / 100</div>
    </div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="summary">${escapeHtml(result.executive_summary)}</div>
  </div>

  <div class="section">
    <h2>Category Score Breakdown</h2>
    <div class="grid-5">
      <div class="metric"><div class="val">${escapeHtml(breakdown.technical ?? '—')}</div><div class="key">Technical</div></div>
      <div class="metric"><div class="val">${escapeHtml(breakdown.on_page ?? '—')}</div><div class="key">On-Page</div></div>
      <div class="metric"><div class="val">${escapeHtml(breakdown.content ?? '—')}</div><div class="key">Content</div></div>
      <div class="metric"><div class="val">${escapeHtml(breakdown.core_web_vitals ?? '—')}</div><div class="key">Core Web Vitals</div></div>
      <div class="metric"><div class="val">${escapeHtml(breakdown.schema ?? '—')}</div><div class="key">Schema.org</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Priority Findings</h2>
    <div class="grid-3">
      <div class="card">
        <h3 style="color:#b91c1c;">Critical Issues</h3>
        <ul>${listItems(result.critical_issues)}</ul>
      </div>
      <div class="card">
        <h3 style="color:#b45309;">Important Issues</h3>
        <ul>${listItems(result.important_issues)}</ul>
      </div>
      <div class="card">
        <h3 style="color:#047857;">Quick Wins (&le; 2 hrs)</h3>
        <ul>${listItems(result.quick_wins)}</ul>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Prioritised Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th style="width:70px;">Priority</th>
          <th style="width:75px;">Category</th>
          <th>Finding, Fix &amp; Falsifiability Check</th>
          <th style="width:65px;">Impact</th>
          <th style="width:60px;">Effort</th>
        </tr>
      </thead>
      <tbody>${recRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <span>Edgelink Technology — SEO Automation Dashboard</span>
    <span>Generated ${new Date().toISOString().slice(0, 10)} • Version ${escapeHtml(result.audit_version || 'v1.0')}</span>
  </div>
</body>
</html>`;
}

/**
 * Pure-JS minimal PDF 1.4 fallback so environments without Chromium still emit
 * a valid, readable PDF file in /tmp/reports/.
 */
function buildFallbackPdfBuffer(client, audit, result) {
  const escapePdfText = (s) =>
    String(s || '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const lines = [
    `EDGELINK SEO AUDIT REPORT - ${client.name}`,
    `Website: ${client.websiteUrl} | Location: ${client.city}, ${client.state}, India`,
    `Audit ID: ${audit.id} | Overall Score: ${result.overall_score}/100`,
    `Breakdown: Technical ${result.score_breakdown?.technical ?? 0}, On-Page ${result.score_breakdown?.on_page ?? 0}, Content ${result.score_breakdown?.content ?? 0}, CWV ${result.score_breakdown?.core_web_vitals ?? 0}, Schema ${result.score_breakdown?.schema ?? 0}`,
    ' ',
    'EXECUTIVE SUMMARY:',
    ...(result.executive_summary || '').match(/.{1,90}(\s|$)/g) || [],
    ' ',
    'TOP RECOMMENDATIONS:',
    ...(result.recommendations || []).slice(0, 6).flatMap((r, i) => [
      `${i + 1}. [${r.priority} | ${r.category}] ${r.finding}`.slice(0, 95),
      `   Fix: ${r.fix}`.slice(0, 95),
      `   Verify: ${r.falsifiability_check}`.slice(0, 95),
    ]),
  ];

  const textOps = [
    'BT',
    '/F1 10 Tf',
    '42 780 Td',
    '14 TL',
    ...lines.map((line, idx) => `${idx === 0 ? '' : 'T* '}(${escapePdfText(line)}) Tj`),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(textOps, 'utf8')} >> stream\n${textOps}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj + '\n';
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

/**
 * Generates a PDF audit report into /tmp/reports/audit-<auditId>.pdf (Cloudflare R2 mock).
 * Primary engine: Puppeteer. Falls back gracefully if Chromium is unavailable in serverless env.
 */
async function generateAuditPdf(client, audit, result) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const fileName = `audit-${audit.id}.pdf`;
  const pdfPath = path.join(REPORTS_DIR, fileName);
  const html = buildReportHtml(client, audit, result);

  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      });
    } finally {
      await browser.close();
    }
    return { pdfPath, engine: 'puppeteer' };
  } catch (err) {
    console.warn('[PDF] Puppeteer unavailable, using built-in fallback PDF:', err.message);
    const fallbackBuf = buildFallbackPdfBuffer(client, audit, result);
    fs.writeFileSync(pdfPath, fallbackBuf);
    return { pdfPath, engine: 'fallback' };
  }
}

module.exports = { generateAuditPdf, buildReportHtml, REPORTS_DIR };
