import assert from 'assert';
import { CryptoService } from '../src/services/crypto.service';

console.log('🧪 Starting AES-256-GCM Cryptographic Security Test Suite...');

// Test 1: Basic encryption and decryption
const testKey = 'sk-proj-superSecretLiveApiKey1234567890abcdefghijklmnopqrstuvwxyz';
const encrypted = CryptoService.encrypt(testKey);

console.log('   [1] Encrypted payload format:', encrypted);
assert(encrypted.includes(':'), 'Payload must be serialized with colons');
const parts = encrypted.split(':');
assert.strictEqual(parts.length, 3, 'Payload must have exactly 3 components (iv:authTag:ciphertext)');
assert.strictEqual(parts[0].length, 32, 'IV must be 16 bytes (32 hex characters)');
assert.strictEqual(parts[1].length, 32, 'Auth Tag must be 16 bytes (32 hex characters)');

// Decrypt and verify
const decrypted = CryptoService.decrypt(encrypted);
assert.strictEqual(decrypted, testKey, 'Decrypted text must match original plaintext key exactly');
console.log('   ✅ [1] Basic Encryption/Decryption: PASS');

// Test 2: Uniqueness of IV (Semantic Security)
// Encrypting the exact same plaintext twice MUST produce different ciphertexts due to fresh IV
const encrypted2 = CryptoService.encrypt(testKey);
assert.notStrictEqual(encrypted, encrypted2, 'Two encryptions of identical plaintext must yield distinct ciphertexts');
console.log('   ✅ [2] IV Randomness & Semantic Security: PASS');

// Test 3: Tampering Protection (Integrity check via AuthTag)
// Flip one byte in the ciphertext
const tamperedParts = [...parts];
const originalCipherHex = tamperedParts[2];
const tamperedCipherHex =
  originalCipherHex.charAt(0) === 'a' ? 'b' + originalCipherHex.slice(1) : 'a' + originalCipherHex.slice(1);
tamperedParts[2] = tamperedCipherHex;
const tamperedPackage = tamperedParts.join(':');

let tamperingCaught = false;
try {
  CryptoService.decrypt(tamperedPackage);
} catch (err: any) {
  tamperingCaught = true;
  assert(err.message.includes('authentication failed') || err.message.includes('tampered'));
}
assert.strictEqual(tamperingCaught, true, 'Tampered ciphertext must fail authentication and throw error');
console.log('   ✅ [3] AEAD Integrity / Tampering Detection: PASS');

console.log('\n🎉 ALL CRYPTOGRAPHIC SECURITY TESTS PASSED SUCCESSFULLY!\n');
