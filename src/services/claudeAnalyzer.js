// src/services/claudeAnalyzer.js
const Anthropic = require('@anthropic-ai/sdk');
const { USE_MOCKS } = require('../mocks');
const { buildMockClaudeResponse } = require('../mocks/claude.mock');

// Exact System Prompt from Section 6.2 (Page 12)
const SYSTEM_PROMPT = `You are a senior SEO analyst with 15+ years experience specialising in
Indian local business websites, healthcare, dental, and real estate sectors.
You produce honest, falsifiable, prioritised SEO audit reports.
Your output must be valid JSON only — no markdown, no preamble.
Every recommendation must include: finding, fix, estimated_impact (High/Medium/Low),
effort (Hours/Days/Weeks), falsifiability_check (how we know if this worked).`;

// Exact User Prompt Template from Section 6.2 (Pages 12-13)
function buildUserPrompt(client, signals) {
  return `Analyse the following SEO signals for: ${client.websiteUrl}
Business type: ${client.businessType}
Business location: ${client.city}, ${client.state}, India

=== ON-PAGE DATA ===
${JSON.stringify(signals.onPage, null, 2)}

=== TECHNICAL DATA ===
${JSON.stringify(signals.technical, null, 2)}

=== CORE WEB VITALS ===
${JSON.stringify(signals.cwv, null, 2)}

=== SCHEMA.ORG DATA ===
${JSON.stringify(signals.schema, null, 2)}

=== GOOGLE SEARCH CONSOLE ===
${JSON.stringify(signals.gsc, null, 2)}

=== KEYWORD RANKINGS ===
${JSON.stringify(signals.rankings, null, 2)}

Respond ONLY with this JSON structure — no other text:
{
  "audit_version": "v1.0",
  "overall_score": <integer 0-100>,
  "score_breakdown": { "technical": <0-100>, "on_page": <0-100>,
                       "content": <0-100>, "core_web_vitals": <0-100>,
                       "schema": <0-100> },
  "critical_issues": [<max 5 items>],
  "important_issues": [<max 8 items>],
  "quick_wins": [<max 5 items — effort <= 2 hours>],
  "recommendations": [{
    "priority": "CRITICAL|HIGH|MEDIUM|LOW",
    "category": "Technical|OnPage|Content|Schema|CWV",
    "finding": "<what is wrong>",
    "fix": "<exact action to take>",
    "estimated_impact": "High|Medium|Low",
    "effort": "Hours|Days|Weeks",
    "falsifiability_check": "<how to verify this worked>"
  }],
  "executive_summary": "<3 sentences max, plain English>"
}`;
}

function parseStrictJson(rawText) {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonSlice =
    firstBrace !== -1 && lastBrace !== -1 ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;

  const parsed = JSON.parse(jsonSlice);

  // Normalize required fields
  return {
    audit_version: parsed.audit_version || 'v1.0',
    overall_score: Math.max(0, Math.min(100, Math.round(Number(parsed.overall_score) || 0))),
    score_breakdown: {
      technical: Number(parsed.score_breakdown?.technical ?? 0),
      on_page: Number(parsed.score_breakdown?.on_page ?? 0),
      content: Number(parsed.score_breakdown?.content ?? 0),
      core_web_vitals: Number(parsed.score_breakdown?.core_web_vitals ?? 0),
      schema: Number(parsed.score_breakdown?.schema ?? 0),
    },
    critical_issues: Array.isArray(parsed.critical_issues) ? parsed.critical_issues.slice(0, 5) : [],
    important_issues: Array.isArray(parsed.important_issues)
      ? parsed.important_issues.slice(0, 8)
      : [],
    quick_wins: Array.isArray(parsed.quick_wins) ? parsed.quick_wins.slice(0, 5) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    executive_summary: String(parsed.executive_summary || ''),
  };
}

/**
 * Runs Claude API (claude-sonnet-4-6) to analyse all collected SEO signals.
 * Uses real Claude API when ANTHROPIC_API_KEY is configured and USE_MOCK_CLAUDE !== 'true'.
 * Falls back cleanly to mock JSON when USE_MOCKS=true and no key is set (or USE_MOCK_CLAUDE=true).
 */
async function analyzeWithClaude(client, signals) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const forceMockClaude = process.env.USE_MOCK_CLAUDE === 'true';

  if (forceMockClaude || (!apiKey && USE_MOCKS)) {
    console.log('[CLAUDE] Using mock structured JSON response (USE_MOCKS active).');
    return buildMockClaudeResponse(client, signals);
  }

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required when USE_MOCKS is not true.');
  }

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
  const userPrompt = buildUserPrompt(client, signals);

  const message = await anthropic.messages.create({
    model,
    max_tokens: 2500,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textContent = (message.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return parseStrictJson(textContent);
}

module.exports = {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseStrictJson,
  analyzeWithClaude,
};
