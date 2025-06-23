import DOMPurify from 'dompurify';
import { ValidationError } from './errorHandling';

// Input sanitization
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}

// Content security policy configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com'],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  }
};

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Input validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  username: /^[a-zA-Z0-9_-]{3,16}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  phoneNumber: /^\+?[\d\s-]{10,}$/
};

// Input sanitization and validation
export function sanitizeAndValidateInput(
  input: string,
  type: keyof typeof patterns,
  options: { required?: boolean; minLength?: number; maxLength?: number } = {}
): string {
  // Check if required
  if (options.required && !input) {
    throw new ValidationError(`${type} is required`);
  }

  // Trim input
  input = input.trim();

  // Check length constraints
  if (options.minLength && input.length < options.minLength) {
    throw new ValidationError(
      `${type} must be at least ${options.minLength} characters`
    );
  }
  if (options.maxLength && input.length > options.maxLength) {
    throw new ValidationError(
      `${type} must be at most ${options.maxLength} characters`
    );
  }

  // Validate against pattern
  if (!patterns[type].test(input)) {
    throw new ValidationError(`Invalid ${type} format`);
  }

  return input;
}

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

// CORS configuration
export const corsConfig = {
  origin: import.meta.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Token validation
export function validateToken(token: string): boolean {
  // Check token format
  if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
    return false;
  }

  try {
    // Check token expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long');
  }

  // Character variety checks
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score < 3) {
    feedback.push('Password should include uppercase, lowercase, numbers, and special characters');
  }

  // Common patterns check
  if (/123|abc|qwerty|password/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Password contains common patterns');
  }

  return {
    score: Math.min(5, score),
    feedback
  };
}

// File upload security
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    scanForMalware?: boolean;
  } = {}
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      reject(new ValidationError('File size exceeds maximum allowed'));
      return;
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      reject(new ValidationError('File type not allowed'));
      return;
    }

    // Basic malware check (file extension spoofing)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypeExtension = file.type.split('/').pop()?.toLowerCase();
    if (fileExtension !== mimeTypeExtension) {
      reject(new ValidationError('File extension does not match content type'));
      return;
    }

    // Additional security checks can be added here
    resolve(true);
  });
}

// Security and CORS configuration for ViewsBoost

export interface SecurityConfig {
  corsOptions: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  rateLimiting: {
    windowMs: number;
    max: number;
  };
  apiKeyValidation: {
    required: boolean;
    header: string;
  };
}

export const securityConfig: SecurityConfig = {
  corsOptions: {
    origin: import.meta.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  apiKeyValidation: {
    required: false, // Set to true in production
    header: 'X-API-Key'
  }
}; 