import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserFacadeService, UserUI } from '../api/facades';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly userFacade = inject(UserFacadeService);

  /**
   * Get current user profile
   */
  getMe(): Observable<UserUI> {
    console.log('[UserService] getMe() called');
    return this.userFacade.getMe();
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
  ): Observable<any> {
    console.log('[UserService] getAllClients() called', {
      firstName,
      lastName,
      email,
      banned,
      page,
      size
    });
    return this.userFacade.getAll({
      page,
      size,
      firstName,
      lastName,
      email,
      banned
    });
  }

  /**
   * Get client by ID (admin only)
   */
  getClientById(id: number): Observable<UserUI> {
    console.log('[UserService] getClientById() called with id:', id);
    return this.userFacade.getById(id);
  }
}
