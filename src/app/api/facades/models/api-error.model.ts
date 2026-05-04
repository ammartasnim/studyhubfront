export interface ApiError {
  success: false;
  message: string;
  status: number;
  error: any;
  rootCause: string | null;
  path: string;
  timestamp: string;
}

export function isApiError(obj: any): obj is ApiError {
  return obj && typeof obj === 'object' && obj.success === false && typeof obj.status === 'number';
}

export function formatApiError(error: any, fallback: string): string {
  if (isApiError(error)) {
    let msg = `[${error.status}] ${error.message}`;
    if (error.rootCause) msg += ` — ${error.rootCause}`;
    return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
