import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { UserControllerService } from '../api-generated/api/userController.service';
import { UserResDto } from '../api-generated/model/userResDto';
import { PageUserResDto } from '../api-generated/model/pageUserResDto';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private userApi: UserControllerService) {}

  /**
   * Get current user profile
   */
  getMe(): Observable<UserResDto> {
    console.log('[UserService] getMe() called');
    return this.userApi.getMe().pipe(
      map((response) => {
        console.log('[UserService] getMe response received:', response);
        return this.normalizeResponse<UserResDto>(response);
      }),
      catchError((error) => {
        console.error('[UserService] getMe error:', error);
        throw error;
      })
    );
  }

  /**
   * Get all clients (admin only)
   */
  getAllClients(
    firstName?: string,
    lastName?: string,
    email?: string,
    banned?: boolean,
    page: number = 0,
    size: number = 10
  ): Observable<PageUserResDto> {
    console.log('[UserService] getAllClients() called', {
      firstName,
      lastName,
      email,
      banned,
      page,
      size
    });
    return this.userApi
      .getAllClients(firstName, lastName, email, banned, page, size)
      .pipe(
        map((response) => {
          console.log('[UserService] getAllClients response received:', response);
          return this.normalizeResponse<PageUserResDto>(response);
        }),
        catchError((error) => {
          console.error('[UserService] getAllClients error:', error);
          throw error;
        })
      );
  }

  /**
   * Get client by ID (admin only)
   */
  getClientById(id: number): Observable<UserResDto> {
    console.log('[UserService] getClientById() called with id:', id);
    return this.userApi.getClientById(id).pipe(
      map((response) => {
        console.log('[UserService] getClientById response received:', response);
        return this.normalizeResponse<UserResDto>(response);
      }),
      catchError((error) => {
        console.error('[UserService] getClientById error:', error);
        throw error;
      })
    );
  }

  /**
   * Ban a user (admin only)
   */
  banUser(id: number): Observable<string> {
    console.log('[UserService] banUser() called with id:', id);
    return this.userApi.banUser(id).pipe(
      map((response) => {
        console.log('[UserService] banUser response received:', response);
        return this.normalizeResponse<string>(response);
      }),
      catchError((error) => {
        console.error('[UserService] banUser error:', error);
        throw error;
      })
    );
  }

  /**
   * Unban a user (admin only)
   */
  unbanUser(id: number): Observable<string> {
    console.log('[UserService] unbanUser() called with id:', id);
    return this.userApi.unbanUser(id).pipe(
      map((response) => {
        console.log('[UserService] unbanUser response received:', response);
        return this.normalizeResponse<string>(response);
      }),
      catchError((error) => {
        console.error('[UserService] unbanUser error:', error);
        throw error;
      })
    );
  }

  /**
   * Normalize response - handle Blob responses
   */
  private normalizeResponse<T>(response: T | Blob): T {
    if (response instanceof Blob) {
      console.warn('[UserService] Response is a Blob, this should not happen after API fixes');
      throw new Error('Unexpected Blob response from API');
    }
    return response as T;
  }
}
