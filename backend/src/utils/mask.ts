/**
 * Secure masking utility for sensitive credentials (API Keys, tokens).
 * Ensures plaintext keys are never logged or exposed over the API.
 */
export function maskApiKey(key: string): string {
  if (!key || typeof key !== 'string') {
    return '••••••••';
  }

  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }

  // Preserve recognized provider prefix if present
  let prefixLength = 4;
  if (trimmed.startsWith('sk-proj-')) {
    prefixLength = 8;
  } else if (trimmed.startsWith('sk-ant-')) {
    prefixLength = 7;
  } else if (trimmed.startsWith('AIzaSy')) {
    prefixLength = 6;
  } else if (trimmed.startsWith('sk-')) {
    prefixLength = 3;
  }

  const prefix = trimmed.slice(0, prefixLength);
  const suffix = trimmed.slice(-4);
  const maskedMiddle = '•'.repeat(16);

  return `${prefix}${maskedMiddle}${suffix}`;
}

/**
 * Strips encryptedKey and returns sanitized DTO safe for API serialization
 */
export function sanitizeProviderResponse<T extends { encryptedKey?: string }>(provider: T): Omit<T, 'encryptedKey'> {
  const { encryptedKey, ...safeProvider } = provider;
  return safeProvider;
}
