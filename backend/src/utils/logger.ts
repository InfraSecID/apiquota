/**
 * Security-aware logger that automatically masks potential API tokens and sensitive patterns.
 */
function sanitizeMessage(msg: string): string {
  // Mask OpenAI keys
  let clean = msg.replace(/sk-[a-zA-Z0-9_-]{20,}/g, 'sk-••••[REDACTED]');
  // Mask Gemini/Google keys
  clean = clean.replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, 'AIzaSy••••[REDACTED]');
  // Mask Bearer tokens
  clean = clean.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ••••[REDACTED]');
  return clean;
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${sanitizeMessage(message)}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${sanitizeMessage(message)}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${sanitizeMessage(message)}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${sanitizeMessage(message)}`, ...args);
    }
  },
};
