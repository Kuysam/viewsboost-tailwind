export class APIError extends Error {
    status: number;
  
    constructor(message: string, status = 500) {
      super(message);
      this.name = 'APIError';
      this.status = status;
    }
  }
  
  export const ErrorMessages = {
    NOT_FOUND: 'Requested resource not found',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    RATE_LIMIT: 'Rate limit exceeded',
  };
  
  export function handleAPIError(error: any): APIError {
    if (error instanceof APIError) return error;
    if (error instanceof Error) return new APIError(error.message);
    return new APIError('An unexpected error occurred');
  }
  