// src/lib/queue.js
const { Queue } = require('bullmq');
const { getRedisConnection } = require('./redis');

const AUDIT_QUEUE_NAME = 'seo-audit-jobs';

const globalForQueue = globalThis;

function getAuditQueue() {
  if (!globalForQueue.__seoAuditQueue) {
    globalForQueue.__seoAuditQueue = new Queue(AUDIT_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return globalForQueue.__seoAuditQueue;
}

// Lazy proxy so importing `auditQueue` in Next.js routes does not connect during `next build`
const auditQueue = {
  add: (...args) => getAuditQueue().add(...args),
  getJobCounts: (...args) => getAuditQueue().getJobCounts(...args),
  getJobs: (...args) => getAuditQueue().getJobs(...args),
};

module.exports = { auditQueue, getAuditQueue, AUDIT_QUEUE_NAME };
