// prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SAMPLE_CLIENTS = [
  {
    name: 'SmileCare Dental Clinic',
    websiteUrl: 'https://example-dental-clinic.com',
    businessType: 'Dental Clinic',
    city: 'Pune',
    state: 'Maharashtra',
    whatsapp: '+919820000001',
    email: 'dr.sharma@example-dental-clinic.com',
  },
  {
    name: 'Apex Multispeciality Healthcare',
    websiteUrl: 'https://example-healthcare-pune.com',
    businessType: 'Healthcare Clinic',
    city: 'Pune',
    state: 'Maharashtra',
    whatsapp: '+919820000002',
    email: 'admin@example-healthcare-pune.com',
  },
  {
    name: 'Skyline Realty Homes',
    websiteUrl: 'https://example-realty-mumbai.com',
    businessType: 'Real Estate Agency',
    city: 'Mumbai',
    state: 'Maharashtra',
    whatsapp: '+919820000003',
    email: 'sales@example-realty-mumbai.com',
  },
];

async function main() {
  console.log('Seeding SEO Automation Dashboard clients...');
  for (const client of SAMPLE_CLIENTS) {
    const record = await prisma.client.upsert({
      where: { websiteUrl: client.websiteUrl },
      update: {
        name: client.name,
        businessType: client.businessType,
        city: client.city,
        state: client.state,
        whatsapp: client.whatsapp,
        email: client.email,
      },
      create: client,
    });
    console.log(`  ✓ Upserted client: ${record.name} (${record.id})`);
  }
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
