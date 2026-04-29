import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthFacadeService } from '../../../api/facades';
import { UserContextService } from '../../../user-context.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacadeService);
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

    
    this.authFacade.login(payload).subscribe({
      next: (response) => 

        this.handleAuthSuccess(response),
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.handleLoginError(err);
      }
    });
  }

  private handleAuthSuccess(response: any): void {
    console.log('[Login] Login successful, handling response');
    this.finalizeAuthSuccess(response);
  }

  private async finalizeAuthSuccess(response: any): Promise<void> {
    let token = response?.token?.trim();
    
    if (!token) {
      
      token = localStorage.getItem('token') || '';
      if (!token) {
        console.error('[Login] No token in auth response or localStorage');
        localStorage.removeItem('token');
        this.userContext.clear();
        this.submitError.set('Login failed. Missing authentication token.');
        this.isSubmitting.set(false);
        return;
      }
      console.warn('[Login] Token not in response, using token from localStorage');
    }

    console.log('[Login] Token received, storing in localStorage');
    localStorage.setItem('token', token);
    
    if (response.user?.id !== undefined && response.user?.email && response.user?.role) {
      console.log('[Login] Setting initial user data:', {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      });
      this.userContext.setUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      } as any);
    }
    console.log('[Login] Loading full user profile from API');
    const user = await this.userContext.loadMe();
    console.log('[Login] Full user profile loaded:', user);
    
    const targetRoute = this.userContext.getDefaultRouteByRole();
    console.log('[Login] Navigation to:', targetRoute);
    this.isSubmitting.set(false);
    await this.router.navigateByUrl(targetRoute);
  }

  private handleLoginError(err: any): void {
    console.error('[Login] Login error:', err);
    
    // Handle new error object format
    if (err?.type === 'BACKEND_UNREACHABLE') {
      this.submitError.set(
        `Cannot connect to backend server. Make sure it's running on http://localhost:8081`
      );
    } else if (err?.message) {
      this.submitError.set(err.message);
    } else if (err instanceof Error) {
      this.submitError.set(err.message || 'Login failed. Please try again.');
    } else {
      this.submitError.set('Login failed. Please check your credentials and try again.');
    }
  }
}
