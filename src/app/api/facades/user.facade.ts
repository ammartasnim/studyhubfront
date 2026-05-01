import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { UserControllerService } from '../api/userController.service';
import { UserResDto } from '../model/userResDto';
import { PageUserResDto } from '../model/pageUserResDto';

import { UserUI, PaginatedUsers, Badge } from './models/user.model';
import { ChangePasswordDto, UserReqDto } from '../model/models';
import { HttpClient } from '@angular/common/http';

const JSON_ACCEPT = { httpHeaderAccept: 'application/json' } as any;

@Injectable({
  providedIn: 'root'
})
export class UserFacadeService {
  private readonly userController = inject(UserControllerService);
  private readonly TOKEN_KEY = 'token';
    private readonly http = inject(HttpClient);


  editMe(dto: UserReqDto): Observable<UserUI> {
    return this.userController.editUser(dto, 'body', false, JSON_ACCEPT).pipe(
        map((response: any) => {
          const userData = response?.user ?? response;
          const token = response?.token;
          if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
          }
          return this.mapToUI(userData);
        }),
        catchError(err => this.handleError(err, 'Failed to edit current user profile'))
    );
}
  editPassword(oldPassword: string, newPassword: string, confirmPassword: string): Observable<void> {
    if (!oldPassword || !newPassword) {
        return throwError(() => new Error('All password fields are required'));
    }

    const dto: ChangePasswordDto = {
        currentPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
    };

    return this.userController.changePassword(dto, 'body', false, JSON_ACCEPT).pipe(
        catchError(err => this.handleError(err, 'Failed to change password'))
    );
}

  getMe(): Observable<UserUI> {
    return this.userController.getMe('body', false, JSON_ACCEPT).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, 'Failed to fetch current user profile'))
    );
  }

  getById(id: number): Observable<UserUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.userController.getClientById(id, 'body', false, JSON_ACCEPT).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to fetch user with ID ${id}`))
    );
  }

  getAll(filters?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    banned?: boolean;
    page?: number;
    size?: number;
  }): Observable<PaginatedUsers> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    return this.userController.getAllClients(
      filters?.firstName,
      filters?.lastName,
      filters?.email,
      filters?.banned,
      page,
      size,
      'body',
      false,
      JSON_ACCEPT
    ).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch users'))
    );
  }

  ban(userId: number): Observable<string> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.userController.banUser(userId, 'body', false, JSON_ACCEPT).pipe(
      catchError(err => this.handleError(err, `Failed to ban user ${userId}`))
    );
  }

 uploadPfp(file: File): Observable<UserUI> {
  if (!file) {
    return throwError(() => new Error('No file provided'));
  }

  const formData = new FormData();
  formData.append('file', file);

  return this.http.put('http://localhost:8081/api/clients/me/pfp', formData, ).pipe(
    map(dto => this.mapToUI(dto as any)),
    catchError(err => this.handleError(err, 'Failed to upload profile picture'))
  );
}


  unban(userId: number): Observable<string> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.userController.unbanUser(userId, 'body', false, JSON_ACCEPT).pipe(
      catchError(err => this.handleError(err, `Failed to unban user ${userId}`))
    );
  }

  getStats(): Observable<{ [key: string]: number }> {
    return this.userController.getUserStats().pipe(
      catchError(err => this.handleError(err, 'Failed to fetch user stats'))
    );
  }

  getBadgeDistribution(): Observable<{ [key: string]: number }> {
    return this.userController.getBadgeDistribution().pipe(
      catchError(err => this.handleError(err, 'Failed to fetch badge distribution'))
    );
  }

  private mapToUI(dto: UserResDto | null | undefined): UserUI {
    if (!dto) {
      throw new Error('User data is null or undefined');
    }

    const firstName = dto.firstName ?? '';
    const lastName = dto.lastName ?? '';
    const role = (dto.role ?? 'Client') as 'Admin' | 'Client';
    const badges = (dto.badges ?? []).map(b => ({
      id: b.id,
      type: b.type,
      userId: b.userId
    }));

    return {
      id: dto.id ?? 0,
      username: dto.username,
      email: dto.email,
      firstName,
      lastName,
      pfp: dto.pfp,
      phone: dto.phone,
      xpPts: dto.xpPts ?? 0,
      level: dto.level,
      banned: dto.banned,
      role,
      badges
    };
  }

  private mapPagedResponse(response: PageUserResDto | null | undefined): PaginatedUsers {
    if (!response) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 0
      };
    }

    return {
      items: (response.content ?? []).map(dto => this.mapToUI(dto)),
      totalItems: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0,
      currentPage: response.number ?? 0,
      pageSize: response.size ?? 0
    };
  }

  private handleError(error: any, message: string): Observable<never> {
    console.error(`[UserFacade] ${message}:`, error);
    const errorMsg = error?.message || error?.error?.message || message;
    return throwError(() => new Error(errorMsg));
  }
}