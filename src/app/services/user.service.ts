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
    return this.userFacade.getById(id);
  }
}
