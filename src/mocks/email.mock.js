// src/mocks/email.mock.js
async function sendEmail(toEmail, clientName, pdfPath, score) {
  console.log('[MOCK EMAIL] → To:    ', toEmail || '(no email on file)');
  console.log('[MOCK EMAIL] → Client:', clientName);
  console.log('[MOCK EMAIL] → Score: ', score + '/100');
  console.log('[MOCK EMAIL] → Report:', pdfPath);
  return { status: 'mock_sent', messageId: 'MOCK_EMAIL_' + Date.now() };
}

module.exports = { sendEmail };
