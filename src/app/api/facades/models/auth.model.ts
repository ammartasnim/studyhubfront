/**
 * Auth UI Model - Clean interface for components
 */
export interface AuthUI {
  token?: string;
  userId?: number;
  username?: string;
  role?: 'Admin' | 'Client';
}

/**
 * Login Request Model
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Register Request Model
 */
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  pfp?: string;
}
