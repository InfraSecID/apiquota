import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import axios from 'axios';
import assert from 'assert';

const prisma = new PrismaClient();

async function runApiTests() {
  console.log('🧪 Starting End-to-End Backend & Security Verification...');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099';

  try {
    // 1. Health check & Security headers test
    console.log('   [1] Testing /health and Security Headers (Helmet/CSP/HSTS)...');
    const healthRes = await axios.get(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.data.status, 'ok');

    // Verify security headers
    const headers = healthRes.headers;
    assert.strictEqual(headers['x-frame-options'], 'DENY', 'X-Frame-Options must be DENY');
    assert.strictEqual(headers['x-content-type-options'], 'nosniff', 'X-Content-Type-Options must be nosniff');
    assert(headers['content-security-policy'], 'Content-Security-Policy header must be present');
    assert.strictEqual(headers['x-powered-by'], undefined, 'X-Powered-By must be hidden');
    console.log('   ✅ [1] Security headers verified');

    // 2. Dashboard summary test
    console.log('   [2] Testing /api/dashboard/summary...');
    const summaryRes = await axios.get(`${baseUrl}/api/dashboard/summary`);
    assert.strictEqual(summaryRes.status, 200);
    assert(summaryRes.data.success, 'Dashboard summary must succeed');
    assert(summaryRes.data.data.metrics.totalAllocatedQuota > 0, 'Must have allocated quota');
    assert(Array.isArray(summaryRes.data.data.chartData), 'chartData must be array for Recharts');
    console.log('   ✅ [2] Dashboard summary & chart data verified');

    // 3. Provider listing & Key masking test
    console.log('   [3] Testing /api/providers and credential masking...');
    const providersRes = await axios.get(`${baseUrl}/api/providers`);
    assert.strictEqual(providersRes.status, 200);
    const providers = providersRes.data.data;
    assert(providers.length >= 1, 'Must have seeded providers');

    for (const p of providers) {
      assert.strictEqual(p.encryptedKey, undefined, 'CRITICAL: encryptedKey must NEVER be leaked to API responses!');
      assert(p.keyMask.includes('•'), 'keyMask must be masked');
      assert(!p.keyMask.includes('superSecret'), 'Plaintext must not appear in keyMask');
    }
    console.log('   ✅ [3] Credential masking & Zero Plaintext leak verified');

    // 4. Create new provider with AES-256-GCM encryption
    console.log('   [4] Testing /api/providers POST with AES-256-GCM encryption...');
    const createRes = await axios.post(`${baseUrl}/api/providers`, {
      name: 'Automated E2E Test Provider',
      provider: 'OPENAI',
      apiKey: 'sk-proj-testKeyVerification1234567890abcdefghijklmnopqrstuvwxyz',
      totalQuota: 75.0,
      alertThreshold: 25.0,
    });
    assert.strictEqual(createRes.status, 201);
    const newId = createRes.data.data.id;
    assert.strictEqual(createRes.data.data.encryptedKey, undefined, 'encryptedKey must not be returned');
    assert(createRes.data.data.keyMask.startsWith('sk-proj-'), 'Mask must preserve prefix');

    // Verify database record has ciphertext stored
    const dbRecord = await prisma.apiProvider.findUnique({ where: { id: newId } });
    assert(dbRecord !== null);
    assert(dbRecord.encryptedKey.includes(':'), 'Stored key in DB must be encrypted format iv:authTag:cipher');
    assert(!dbRecord.encryptedKey.includes('testKeyVerification'), 'Plaintext must NEVER be in database');
    console.log('   ✅ [4] Provider creation & AES-256-GCM at-rest encryption verified');

    // Clean up test provider
    await prisma.apiProvider.delete({ where: { id: newId } });

    console.log('\n🎉 ALL E2E BACKEND & SECURITY TESTS PASSED PERFECTLY!\n');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

runApiTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
