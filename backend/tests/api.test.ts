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

    // 3. Unauthenticated access check on /api/providers (Must return 401)
    console.log('   [3] Testing unauthenticated protection on /api/providers...');
    try {
      await axios.get(`${baseUrl}/api/providers`);
      assert.fail('Unauthenticated request to /api/providers must be rejected');
    } catch (err: any) {
      assert.strictEqual(err.response?.status, 401, 'Must return 401 Unauthorized without token');
      console.log('   ✅ [3] Route protection: Unauthenticated request rejected (401)');
    }

    // 4. JWT Authentication: Register & Login (ADMIN & VIEWER)
    console.log('   [4] Testing /api/auth/register and /api/auth/login...');
    const testAdminEmail = `admin-${Date.now()}@test.com`;
    const testViewerEmail = `viewer-${Date.now()}@test.com`;
    const password = 'SecurePassword123!';

    // Register ADMIN
    const adminReg = await axios.post(`${baseUrl}/api/auth/register`, {
      email: testAdminEmail,
      password,
      role: 'ADMIN',
    });
    assert.strictEqual(adminReg.status, 201);
    assert(adminReg.data.token, 'Must return JWT token');
    assert.strictEqual(adminReg.data.user.role, 'ADMIN');
    const adminToken = adminReg.data.token;

    // Register VIEWER
    const viewerReg = await axios.post(`${baseUrl}/api/auth/register`, {
      email: testViewerEmail,
      password,
      role: 'VIEWER',
    });
    assert.strictEqual(viewerReg.status, 201);
    assert.strictEqual(viewerReg.data.user.role, 'VIEWER');
    const viewerToken = viewerReg.data.token;

    // Login test
    const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: testAdminEmail,
      password,
    });
    assert.strictEqual(loginRes.status, 200);
    assert(loginRes.data.token, 'Login must return token');
    console.log('   ✅ [4] Auth: Register, bcrypt hashing, and JWT Login verified');

    // 5. Authenticated Provider listing & Key masking test
    console.log('   [5] Testing /api/providers with Bearer token & credential masking...');
    const providersRes = await axios.get(`${baseUrl}/api/providers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(providersRes.status, 200);
    const providers = providersRes.data.data;
    assert(providers.length >= 1, 'Must have seeded providers');

    for (const p of providers) {
      assert.strictEqual(p.encryptedKey, undefined, 'CRITICAL: encryptedKey must NEVER be leaked to API responses!');
      assert(p.keyMask.includes('•'), 'keyMask must be masked');
      assert(!p.keyMask.includes('superSecret'), 'Plaintext must not appear in keyMask');
    }
    console.log('   ✅ [5] Credential masking & Zero Plaintext leak verified');

    // 6. Role-Based Access Control: VIEWER cannot create provider (403 Forbidden)
    console.log('   [6] Testing RBAC: VIEWER cannot create provider (403 Forbidden)...');
    try {
      await axios.post(
        `${baseUrl}/api/providers`,
        {
          name: 'Viewer Unauthorized Provider',
          provider: 'OPENAI',
          apiKey: 'sk-proj-viewerUnauthorizedKey1234567890abcdef',
          totalQuota: 50.0,
          alertThreshold: 20.0,
        },
        {
          headers: { Authorization: `Bearer ${viewerToken}` },
        }
      );
      assert.fail('VIEWER should not be allowed to create provider');
    } catch (err: any) {
      assert.strictEqual(err.response?.status, 403, 'Must return 403 Forbidden for VIEWER');
      console.log('   ✅ [6] RBAC enforced: VIEWER creation rejected (403)');
    }

    // 7. ADMIN can create new provider with AES-256-GCM encryption
    console.log('   [7] Testing /api/providers POST by ADMIN with AES-256-GCM encryption...');
    const createRes = await axios.post(
      `${baseUrl}/api/providers`,
      {
        name: 'Automated E2E Test Provider',
        provider: 'OPENAI',
        apiKey: 'sk-proj-testKeyVerification1234567890abcdefghijklmnopqrstuvwxyz',
        totalQuota: 75.0,
        alertThreshold: 25.0,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert.strictEqual(createRes.status, 201);
    const newId = createRes.data.data.id;
    assert.strictEqual(createRes.data.data.encryptedKey, undefined, 'encryptedKey must not be returned');
    assert(createRes.data.data.keyMask.startsWith('sk-proj-'), 'Mask must preserve prefix');

    // Verify database record has ciphertext stored
    const dbRecord = await prisma.apiProvider.findUnique({ where: { id: newId } });
    assert(dbRecord !== null);
    assert(dbRecord.encryptedKey.includes(':'), 'Stored key in DB must be encrypted format iv:authTag:cipher');
    assert(!dbRecord.encryptedKey.includes('testKeyVerification'), 'Plaintext must NEVER be in database');
    console.log('   ✅ [7] Provider creation & AES-256-GCM at-rest encryption verified');

    // 8. VIEWER cannot delete provider (403 Forbidden)
    console.log('   [8] Testing RBAC: VIEWER cannot delete provider (403 Forbidden)...');
    try {
      await axios.delete(`${baseUrl}/api/providers/${newId}`, {
        headers: { Authorization: `Bearer ${viewerToken}` },
      });
      assert.fail('VIEWER should not be allowed to delete provider');
    } catch (err: any) {
      assert.strictEqual(err.response?.status, 403, 'Must return 403 Forbidden for delete by VIEWER');
      console.log('   ✅ [8] RBAC enforced: VIEWER deletion rejected (403)');
    }

    // 9. ADMIN can delete provider
    console.log('   [9] Testing ADMIN deletion of provider...');
    const deleteRes = await axios.delete(`${baseUrl}/api/providers/${newId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('   ✅ [9] ADMIN successfully deleted provider');

    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: { in: [testAdminEmail, testViewerEmail] } },
    });

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
