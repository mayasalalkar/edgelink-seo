// src/crawlers/schemaValidator.js
/**
 * Step 4: Schema.org validator.
 * Extracts JSON-LD blocks and microdata itemtypes from the Cheerio DOM
 * and validates structure for local business SEO signals.
 */
function validateSchema($) {
  const jsonLdBlocks = [];
  const parseErrors = [];
  const detectedTypes = new Set();

  $('script[type="application/ld+json"]').each((index, el) => {
    const raw = $(el).html();
    if (!raw || !raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
          ? parsed['@graph']
          : [parsed];

      items.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const types = Array.isArray(item['@type'])
          ? item['@type']
          : item['@type']
            ? [item['@type']]
            : [];
        types.forEach((t) => detectedTypes.add(t));
        jsonLdBlocks.push({
          type: types.join(', ') || 'Unknown',
          hasContext: Boolean(item['@context'] || parsed['@context']),
          hasName: Boolean(item.name),
          hasAddress: Boolean(item.address),
          hasTelephone: Boolean(item.telephone),
        });
      });
    } catch (err) {
      parseErrors.push(`JSON-LD block #${index + 1}: ${err.message}`);
    }
  });

  const microdataTypes = [];
  $('[itemscope][itemtype]').each((_, el) => {
    const type = $(el).attr('itemtype');
    if (type) microdataTypes.push(type);
  });

  const typeList = Array.from(detectedTypes);
  const localBusinessTypes = [
    'LocalBusiness',
    'Dentist',
    'MedicalClinic',
    'Physician',
    'RealEstateAgent',
    'Organization',
  ];
  const hasLocalBusinessSchema = typeList.some((t) => localBusinessTypes.includes(t));
  const hasFaqSchema = typeList.includes('FAQPage');
  const hasBreadcrumbSchema = typeList.includes('BreadcrumbList');

  const missingRecommended = [];
  if (!hasLocalBusinessSchema) missingRecommended.push('LocalBusiness / Industry-specific schema');
  if (!hasFaqSchema) missingRecommended.push('FAQPage');
  if (!hasBreadcrumbSchema) missingRecommended.push('BreadcrumbList');

  return {
    jsonLdCount: jsonLdBlocks.length,
    detectedTypes: typeList,
    microdataTypes,
    hasLocalBusinessSchema,
    hasFaqSchema,
    hasBreadcrumbSchema,
    parseErrors,
    missingRecommended,
    blocks: jsonLdBlocks,
    isValid: jsonLdBlocks.length > 0 && parseErrors.length === 0,
  };
}

module.exports = { validateSchema };
