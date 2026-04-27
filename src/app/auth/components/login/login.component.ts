import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthControllerService } from '../../../api-generated/api/authController.service';
import { AuthResDto } from '../../../api-generated/model/authResDto';
import { UserContextService } from '../../../user-context.service';

const AUTH_TOKEN_KEY = 'token';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthControllerService);
  private readonly router = inject(Router);
  private readonly userContext = inject(UserContextService);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly usernameControl = this.form.controls.username;
  readonly passwordControl = this.form.controls.password;

  readonly canSubmit = computed(() => this.form.valid && !this.isSubmitting());

  onSubmit(): void {
    this.submitted.set(true);
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      username: this.form.controls.username.value.trim(),
      password: this.form.controls.password.value
    };

    console.log('[Login] Submitting login form for user:', payload.username);
    this.authApi.login(payload).subscribe({
      next: (response) => this.handleAuthSuccess(response),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.handleLoginError(err);
      }
    });
  }

  private handleAuthSuccess(response: AuthResDto | Blob): void {
    console.log('[Login] Login successful, handling response');
    if (response instanceof Blob) {
      response
        .text()
        .then((rawText) => {
          this.finalizeAuthSuccess(this.parseAuthResponse(rawText));
        })
        .catch(() => {
          this.finalizeAuthSuccess({});
        });
      return;
    }

    this.finalizeAuthSuccess(response);
  }

  private async finalizeAuthSuccess(response: AuthResDto): Promise<void> {
    const token = response.token?.trim();
    if (!token) {
      console.error('[Login] No token in auth response');
      localStorage.removeItem(AUTH_TOKEN_KEY);
      this.userContext.clear();
      this.submitError.set('Login failed. Missing authentication token.');
      this.isSubmitting.set(false);
      return;
    }

    console.log('[Login] Token received, storing in localStorage');
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    // Set user context with auth response data
    if (response.userId !== undefined && response.username && response.role) {
      console.log('[Login] Setting initial user data:', {
        id: response.userId,
        username: response.username,
        role: response.role
      });
      this.userContext.setUser({
        id: response.userId,
        username: response.username,
        role: response.role
      } as any);
    }
    
    // Load full user data and wait for completion
    console.log('[Login] Loading full user profile from API');
    await this.userContext.loadMe();
    
    const targetRoute = this.userContext.getDefaultRouteByRole();
    console.log('[Login] Navigation to:', targetRoute);
    this.isSubmitting.set(false);
    await this.router.navigateByUrl(targetRoute);
  }

  private parseAuthResponse(rawText: string): AuthResDto {
    try {
      return JSON.parse(rawText) as AuthResDto;
    } catch {
      return {} as AuthResDto;
    }
  }

  private handleLoginError(err: HttpErrorResponse): void {
    console.error('[Login] Login error:', err);
    if (err.error instanceof Blob) {
      err.error
        .text()
        .then((rawText) => {
          try {
            const parsed = JSON.parse(rawText) as { message?: string };
            this.submitError.set(parsed.message || 'Login failed. Please check your credentials and try again.');
          } catch {
            this.submitError.set('Login failed. Please check your credentials and try again.');
          }
        })
        .catch(() => {
          this.submitError.set('Login failed. Please check your credentials and try again.');
        });
      return;
    }

    this.submitError.set(err.error?.message || 'Login failed. Please check your credentials and try again.');
  }
}
