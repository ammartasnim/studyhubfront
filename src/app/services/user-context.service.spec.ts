import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { UserContextService } from './user-context.service';
import { UserService } from './user.service';
import { UserUI } from '../api/facades/models/user.model';

const mockUser: UserUI = {
  id: 1,
  username: 'testuser',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  xpPts: 100,
  level: 2,
  role: 'Client',
  badges: []
};

describe('UserContextService', () => {
  let service: UserContextService;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('UserService', ['getMe']);

    TestBed.configureTestingModule({
      providers: [
        UserContextService,
        { provide: UserService, useValue: spy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UserContextService);
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null user and isLoading false', () => {
    expect(service.user()).toBeNull();
    expect(service.isLoading()).toBeFalse();
  });

  it('should set user with setUser()', () => {
    service.setUser(mockUser);
    expect(service.user()).toEqual(mockUser);
  });

  it('should clear user with clear()', () => {
    service.setUser(mockUser);
    service.clear();
    expect(service.user()).toBeNull();
  });

  it('should return client route for Client role', () => {
    service.setUser(mockUser);
    expect(service.getDefaultRouteByRole()).toBe('/dashboard/client');
  });

  it('should return admin route for Admin role', () => {
    service.setUser({ ...mockUser, role: 'Admin' });
    expect(service.getDefaultRouteByRole()).toBe('/dashboard/admin');
  });

  it('should return default route when user is null', () => {
    expect(service.getDefaultRouteByRole()).toBe('/dashboard');
  });

  it('should not load user if no token stored', async () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    await service.initializeFromStoredToken();
    expect(service.user()).toBeNull();
    expect(userServiceSpy.getMe).not.toHaveBeenCalled();
  });

  it('should not call loadMe if token is whitespace only', async () => {
    spyOn(localStorage, 'getItem').and.returnValue('   ');
    await service.initializeFromStoredToken();
    expect(service.user()).toBeNull();
    expect(userServiceSpy.getMe).not.toHaveBeenCalled();
  });

  it('should call loadMe when token exists', async () => {
    spyOn(localStorage, 'getItem').and.returnValue('valid-token');
    userServiceSpy.getMe.and.returnValue(of(mockUser));
    await service.initializeFromStoredToken();
    expect(userServiceSpy.getMe).toHaveBeenCalled();
    expect(service.user()).toEqual(mockUser);
  });

  describe('loadMe', () => {
    it('should set user on success', async () => {
      userServiceSpy.getMe.and.returnValue(of(mockUser));
      const result = await service.loadMe();
      expect(result).toEqual(mockUser);
      expect(service.user()).toEqual(mockUser);
      expect(service.isLoading()).toBeFalse();
    });

    it('should set user to null on error', async () => {
      userServiceSpy.getMe.and.returnValue(throwError(() => new Error('Network error')));
      const result = await service.loadMe();
      expect(result).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isLoading()).toBeFalse();
    });

    it('should set isLoading to false after loading', async () => {
      userServiceSpy.getMe.and.returnValue(of(mockUser));
      await service.loadMe();
      expect(service.isLoading()).toBeFalse();
    });

    it('should handle Blob response', async () => {
      const blob = new Blob([JSON.stringify(mockUser)], { type: 'application/json' });
      userServiceSpy.getMe.and.returnValue(of(blob as any));
      const result = await service.loadMe();
      expect(result).toEqual(mockUser);
    });
  });
});
