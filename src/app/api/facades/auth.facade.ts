import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AuthControllerService } from '../generated/api/authController.service';
import { AuthResDto } from '../generated/model/authResDto';
import { LoginReqDto } from '../generated/model/loginReqDto';
import { RegisterReqDto } from '../generated/model/registerReqDto';

import { AuthUI, LoginRequest, RegisterRequest } from './models/auth.model';
/*ok*/
/**
 * Auth Facade Service
 * 
 * Wraps the generated AuthControllerService with:
 * - Clean method names (login, register)
 * - DTO to UI Model mapping
 * - Token storage and management
 * - Null/undefined safety
 * - Error handling with logging
 */
@Injectable({
  providedIn: 'root'
})
export class AuthFacadeService {
  private readonly authController = inject(AuthControllerService);
  private readonly TOKEN_KEY = 'token';

  /**
   * Login user with username and password
   */
  login(credentials: LoginRequest): Observable<AuthUI> {
    if (!credentials?.username || !credentials?.password) {
      return throwError(() => new Error('Username and password are required'));
    }

    const loginReq: LoginReqDto = {
      username: credentials.username,
      password: credentials.password
    };

    return this.authController.login(loginReq).pipe(
      tap(dto => {
        console.log('[AuthFacade] Login response received:', {
          responseType: typeof dto,
          isBlob: dto instanceof Blob,
          hasToken: !!dto?.token,
          userId: dto?.userId,
          username: dto?.username,
          role: dto?.role,
          rawResponse: dto
        });
        this.storeToken(dto?.token);
      }),
      map(dto => {
        // Handle Blob responses that might contain JSON string
        if (dto instanceof Blob) {
          console.error('[AuthFacade] Received Blob response instead of JSON object');
          throw new Error('Backend returned Blob instead of JSON - serialization issue');
        }
        return this.mapToUI(dto);
      }),
      catchError(err => this.handleError(err, 'Login failed'))
    );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<AuthUI> {
    if (!data?.username || !data?.password || !data?.email || !data?.firstName || !data?.lastName) {
      return throwError(() => new Error('Required fields are missing'));
    }

    const registerReq: RegisterReqDto = {
      username: data.username,
      password: data.password,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      pfp: data.pfp
    };

    return this.authController.register(registerReq).pipe(
      tap(dto => {
        console.log('[AuthFacade] Register response received:', {
          hasToken: !!dto?.token,
          userId: dto?.userId,
          username: dto?.username,
          role: dto?.role
        });
        this.storeToken(dto?.token);
      }),
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, 'Registration failed'))
    );
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Logout user (clear token)
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Store token in local storage
   */
  private storeToken(token?: string): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Map DTO to UI Model
   */
  private mapToUI(dto: AuthResDto | null | undefined): AuthUI {
    if (!dto) {
      throw new Error('Auth response is null or undefined');
    }

    const role = (dto.role ?? 'Client') as 'Admin' | 'Client';

    return {
      token: dto.token,
      userId: dto.userId,
      username: dto.username,
      role
    };
  }

  /**
   * Handle errors with logging
   */
  private handleError(error: any, message: string): Observable<never> {
    console.error(`[AuthFacade] ${message}:`, error);
    const errorMsg = error?.message || error?.error?.message || message;
    return throwError(() => new Error(errorMsg));
  }
}
