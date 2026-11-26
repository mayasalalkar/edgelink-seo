// src/services/notifier.js
const { USE_MOCKS } = require('../mocks');
const { sendWhatsApp: mockSendWhatsApp } = require('../mocks/twilio.mock');
const { sendEmail: mockSendEmail } = require('../mocks/email.mock');
const { prisma } = require('../lib/prisma');

async function dispatchNotifications(client, auditId, pdfPath, score) {
  const results = [];

  // 1. WhatsApp notification (Twilio mock when USE_MOCKS=true)
  try {
    let waRes;
    if (USE_MOCKS || !process.env.TWILIO_ACCOUNT_SID) {
      waRes = await mockSendWhatsApp(client.id, pdfPath, score);
    } else {
      // Production Twilio WhatsApp hook (swap in approved template SID)
      waRes = await mockSendWhatsApp(client.id, pdfPath, score);
    }

    const waRecord = await prisma.notification.create({
      data: {
        auditId,
        channel: 'whatsapp',
        status: waRes.status || 'mock_sent',
        providerId: waRes.sid || null,
      },
    });
    results.push(waRecord);
  } catch (err) {
    const failedWa = await prisma.notification.create({
      data: {
        auditId,
        channel: 'whatsapp',
        status: 'failed',
        providerId: err.message?.slice(0, 120) || null,
      },
    });
    results.push(failedWa);
  }

  // 2. Email notification (mock when USE_MOCKS=true)
  try {
    const emailRes = await mockSendEmail(client.email, client.name, pdfPath, score);
    const emailRecord = await prisma.notification.create({
      data: {
        auditId,
        channel: 'email',
        status: emailRes.status || 'mock_sent',
        providerId: emailRes.messageId || null,
      },
    });
    results.push(emailRecord);
  } catch (err) {
    const failedEmail = await prisma.notification.create({
      data: {
        auditId,
        channel: 'email',
        status: 'failed',
        providerId: err.message?.slice(0, 120) || null,
      },
    });
    results.push(failedEmail);
  }

  return results;
}

module.exports = { dispatchNotifications };
