// src/worker/index.js
require('dotenv').config();
const { Worker } = require('bullmq');
const { createRedisConnection } = require('../lib/redis');
const { AUDIT_QUEUE_NAME } = require('../lib/queue');
const { runAuditPipeline } = require('../services/auditPipeline');

const concurrency = Number(process.env.WORKER_CONCURRENCY || 2);

console.log(`[WORKER] Starting BullMQ worker on queue "${AUDIT_QUEUE_NAME}" (concurrency=${concurrency})...`);
console.log(`[WORKER] USE_MOCKS=${process.env.USE_MOCKS === 'true'}`);

const worker = new Worker(
  AUDIT_QUEUE_NAME,
  async (job) => {
    const { auditId } = job.data || {};
    if (!auditId) {
      throw new Error(`Job ${job.id} missing auditId payload`);
    }
    console.log(`[WORKER] Picked up job ${job.id} for audit ${auditId}`);
    const completed = await runAuditPipeline(auditId);
    return {
      auditId,
      overallScore: completed.overallScore,
      pdfPath: completed.pdfPath,
    };
  },
  {
    connection: createRedisConnection(),
    concurrency,
  }
);

worker.on('ready', () => {
  console.log(`[WORKER] Connected to Redis and listening for jobs on "${AUDIT_QUEUE_NAME}".`);
});

worker.on('completed', (job, result) => {
  console.log(`[WORKER] Job ${job.id} completed:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed:`, err?.message || err);
});

async function shutdown(signal) {
  console.log(`[WORKER] Received ${signal}. Shutting down gracefully...`);
  await worker.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
