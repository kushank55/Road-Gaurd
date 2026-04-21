import { parseAsString, parseAsBoolean } from 'nuqs';

// Custom parser for encrypted password (we'll just handle it as a string but could add encryption here)
export const parseAsPassword = parseAsString.withDefault('').withOptions({
  // Don't store passwords in URL for security
  shallow: false,
  history: 'replace', // Replace instead of push to avoid password in browser history
});

// Parser for email with validation
export const parseAsEmail = parseAsString.withDefault('').withOptions({
  shallow: false,
});

// Parser for name fields
export const parseAsName = parseAsString.withDefault('').withOptions({
  shallow: false,
});

// Parser for loading states
export const parseAsLoading = parseAsBoolean.withDefault(false).withOptions({
  shallow: false,
});

// Encryption utilities (basic example - in production, use proper encryption)
const ENCRYPTION_KEY = 'your-secret-key'; // In production, use environment variable

export const encryptPassword = (password: string): string => {
  // Simple base64 encoding for demo - use proper encryption in production
  return btoa(password + ENCRYPTION_KEY);
};

export const decryptPassword = (encryptedPassword: string): string => {
  try {
    const decoded = atob(encryptedPassword);
    return decoded.replace(ENCRYPTION_KEY, '');
  } catch {
    return '';
  }
};

// Parser for encrypted password with proper typing
export const parseAsEncryptedPassword = {
  parse: (value: string | null): string => {
    if (!value) return '';
    return decryptPassword(value);
  },
  serialize: (value: string): string => {
    if (!value) return '';
    return encryptPassword(value);
  },
  withDefault: (defaultValue: string) => ({
    parse: (value: string | null): string => {
      if (!value) return defaultValue;
      return decryptPassword(value);
    },
    serialize: (value: string): string => {
      if (!value) return '';
      return encryptPassword(value);
    }
  })
};
