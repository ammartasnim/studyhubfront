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
import { formatApiError } from './models/api-error.model';

const JSON_ACCEPT = { httpHeaderAccept: 'application/json' } as any;

@Injectable({
  providedIn: 'root'
})
export class UserFacadeService {
  private readonly userController = inject(UserControllerService);
  private readonly TOKEN_KEY = 'token';
  private readonly http = inject(HttpClient);


  // ─── PROFILE ─────────────────────────────────────────────────────────────

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



  // ─── ADMIN: USER LIST ────────────────────────────────────────────────────

  getAllRaw(filters?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    banned?: boolean;
    page?: number;
    size?: number;
  }): Observable<PaginatedUsers> {
    const params: Record<string, any> = {
      page: filters?.page ?? 0,
      size: filters?.size ?? 10
    };
    if (filters?.firstName?.trim()) params['firstName'] = filters.firstName.trim();
    if (filters?.lastName?.trim()) params['lastName'] = filters.lastName.trim();
    if (filters?.email?.trim()) params['email'] = filters.email.trim();
    if (filters?.banned != null) params['banned'] = filters.banned;

    return this.http.get<any>('http://localhost:8081/api/clients', { params }).pipe(
      map(res => {
        const content: any[] = res.content ?? [];
        return {
          items: content.map(u => this.mapToUI(u)),
          totalItems: res.totalElements ?? 0,
          totalPages: res.totalPages ?? 0,
          currentPage: res.number ?? 0,
          pageSize: res.size ?? 0
        };
      }),
      catchError(err => this.handleError(err, 'Failed to fetch users'))
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

  // ─── ADMIN: BAN / PFP / STATS ────────────────────────────────────────────

  ban(userId: number): Observable<string> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    // Using HttpClient directly to expect plain text, preventing JSON parse errors
    return this.http.patch(`http://localhost:8081/api/clients/${userId}/ban`, {}, { responseType: 'text' }).pipe(
      catchError(err => this.handleError(err, `Failed to ban user ${userId}`))
    ) as Observable<string>;
  }

  uploadPfp(file: File): Observable<UserUI> {
    if (!file) {
      return throwError(() => new Error('No file provided'));
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post('http://localhost:8081/api/clients/me/pfp', formData).pipe(
      map(dto => this.mapToUI(dto as any)),
      catchError(err => this.handleError(err, 'Failed to upload profile picture'))
    );
  }

  unban(userId: number): Observable<string> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    // Using HttpClient directly to expect plain text, preventing JSON parse errors
    return this.http.patch(`http://localhost:8081/api/clients/${userId}/unban`, {}, { responseType: 'text' }).pipe(
      catchError(err => this.handleError(err, `Failed to unban user ${userId}`))
    ) as Observable<string>;
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

  BASE_URL = 'http://localhost:8081';
  getUserGrowth(): Observable<{ date: string; count: number }[]> {
  return this.http.get<{ date: string; count: number }[]>(
    `${this.BASE_URL}/api/clients/stats/growth`
  ).pipe(catchError(err => this.handleError(err, 'Failed to fetch user growth')));
}

  // ─── MAPPERS ─────────────────────────────────────────────────────────────

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
   userId: dto.id,
  earnedAt: (b as any).earnedAt
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
    const formatted = formatApiError(error, message);
    console.groupCollapsed(`[UserFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
}