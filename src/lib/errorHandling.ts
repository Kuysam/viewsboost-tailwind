// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Custom error class for Firebase errors
export class FirebaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'FirebaseError';
  }
}

// Custom error class for quota errors
export class QuotaError extends Error {
  constructor(
    message: string,
    public quotaRemaining: number
  ) {
    super(message);
    this.name = 'QuotaError';
  }
}

// Custom error class for validation errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error messages
export const ErrorMessages = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  RATE_LIMITED: 'Too many requests. Please try again later',
  NETWORK_ERROR: 'Network error. Please check your connection',
  QUOTA_EXCEEDED: 'API quota exceeded. Please try again tomorrow',
  VALIDATION_ERROR: 'Invalid input provided',
  TIMEOUT: 'Request timed out',
  DEFAULT: 'An unexpected error occurred'
} as const;

// Helper function to handle Firebase errors
export function handleFirebaseError(error: any): FirebaseError {
  console.error('Firebase Error:', error);
  
  // Map common Firebase error codes to user-friendly messages
  const errorMap: Record<string, { message: string; retryable: boolean }> = {
    'auth/user-not-found': { 
      message: 'User not found',
      retryable: false
    },
    'auth/wrong-password': { 
      message: 'Invalid password',
      retryable: false
    },
    'auth/email-already-in-use': { 
      message: 'Email is already registered',
      retryable: false
    },
    'auth/invalid-email': { 
      message: 'Invalid email address',
      retryable: false
    },
    'auth/operation-not-allowed': { 
      message: 'Operation not allowed',
      retryable: false
    },
    'auth/weak-password': { 
      message: 'Password is too weak',
      retryable: false
    },
    'auth/network-request-failed': { 
      message: 'Network error occurred',
      retryable: true
    },
    'auth/too-many-requests': { 
      message: 'Too many attempts. Please try again later',
      retryable: true
    }
  };

  const errorInfo = errorMap[error.code] || { 
    message: error.message || ErrorMessages.DEFAULT,
    retryable: false
  };

  return new FirebaseError(errorInfo.message, error.code, errorInfo.retryable);
}

// Helper function to handle API errors
export function handleAPIError(error: any): APIError | QuotaError | ValidationError {
  console.error('API Error:', error);

  // Handle quota errors
  if (error.response?.status === 429 || error.code === 'quotaExceeded') {
    return new QuotaError(
      ErrorMessages.QUOTA_EXCEEDED,
      error.quotaRemaining || 0
    );
  }

  // Handle validation errors
  if (error.response?.status === 400) {
    return new ValidationError(
      error.response.data?.message || ErrorMessages.VALIDATION_ERROR,
      error.response.data?.field,
      error.response.data?.value
    );
  }

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const message = error.response.data?.message || getMessageForStatus(status);
    const retryable = isRetryableStatus(status);
    return new APIError(message, status, error.code, retryable);
  } else if (error.request) {
    // The request was made but no response was received
    return new APIError(ErrorMessages.NETWORK_ERROR, 0, 'NETWORK_ERROR', true);
  } else {
    // Something happened in setting up the request that triggered an Error
    return new APIError(error.message || ErrorMessages.DEFAULT, undefined, undefined, false);
  }
}

// Helper function to get message based on HTTP status code
function getMessageForStatus(status: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Bad request',
    401: ErrorMessages.UNAUTHORIZED,
    403: ErrorMessages.FORBIDDEN,
    404: ErrorMessages.NOT_FOUND,
    408: ErrorMessages.TIMEOUT,
    429: ErrorMessages.RATE_LIMITED,
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
    504: 'Gateway timeout'
  };

  return statusMessages[status] || ErrorMessages.DEFAULT;
}

// Helper function to determine if a status code is retryable
function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

// Validation helpers
export function validateInput(value: any, rules: ValidationRule[]): void {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      throw new ValidationError(rule.message, rule.field, value);
    }
  }
}

interface ValidationRule {
  field: string;
  message: string;
  validate: (value: any) => boolean;
}

// Common validation rules
export const ValidationRules = {
  required: (field: string) => ({
    field,
    message: `${field} is required`,
    validate: (value: any) => value !== undefined && value !== null && value !== ''
  }),
  minLength: (field: string, min: number) => ({
    field,
    message: `${field} must be at least ${min} characters`,
    validate: (value: string) => value.length >= min
  }),
  maxLength: (field: string, max: number) => ({
    field,
    message: `${field} must be at most ${max} characters`,
    validate: (value: string) => value.length <= max
  }),
  email: (field: string = 'email') => ({
    field,
    message: 'Invalid email address',
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }),
  url: (field: string) => ({
    field,
    message: 'Invalid URL',
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  })
}; 