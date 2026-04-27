import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthControllerService } from '../../../api-generated/api/authController.service';
import { AuthResDto } from '../../../api-generated/model/authResDto';
import { RegisterReqDto } from '../../../api-generated/model/registerReqDto';
import { UserContextService } from '../../../user-context.service';

const AUTH_TOKEN_KEY = 'token';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthControllerService);
  private readonly router = inject(Router);
  private readonly userContext = inject(UserContextService);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
    pfp: [''],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: this.passwordMatchValidator() });


  onSubmit(): void {
    this.submitted.set(true);
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const rawValue = this.form.getRawValue();

    const payload: RegisterReqDto = {
      firstName: rawValue.firstName,
      lastName: rawValue.lastName,
      email: rawValue.email,
      username: rawValue.username,
      password: rawValue.password,
      phone: rawValue.phone || undefined,
      pfp: rawValue.pfp || undefined
    };
    this.authApi.register(payload).subscribe({
      next: (response) => {
        this.handleAuthSuccess(response);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.handleRegisterError(err);
      }
    });
  }

  private handleAuthSuccess(response: AuthResDto | Blob): void {
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
      localStorage.removeItem(AUTH_TOKEN_KEY);
      this.userContext.clear();
      this.submitError.set('Registration succeeded, but authentication token is missing. Please sign in.');
      this.isSubmitting.set(false);
      await this.router.navigateByUrl('/auth/login');
      return;
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    // Set user context with auth response data
    if (response.userId !== undefined && response.username && response.role) {
      this.userContext.setUser({
        id: response.userId,
        username: response.username,
        role: response.role
      } as any);
    }
    
    // Load full user data in background for complete profile
    void this.userContext.loadMe();
    
     const targetRoute = this.userContext.getDefaultRouteByRole();
     this.isSubmitting.set(false);
     await this.router.navigateByUrl(targetRoute);
   }

  private handleRegisterError(err: HttpErrorResponse): void {
    if (err.error instanceof Blob) {
      err.error
        .text()
        .then((rawText) => {
          try {
            const parsed = JSON.parse(rawText) as { message?: string };
            this.submitError.set(parsed.message || 'An error occurred during registration. Please try again.');
          } catch {
            this.submitError.set('An error occurred during registration. Please try again.');
          }
        })
        .catch(() => {
          this.submitError.set('An error occurred during registration. Please try again.');
        });
      return;
    }

    this.submitError.set(err.error?.message || 'An error occurred during registration. Please try again.');
  }

  private parseAuthResponse(rawText: string): AuthResDto {
    try {
      return JSON.parse(rawText) as AuthResDto;
    } catch {
      return {} as AuthResDto;
    }
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }
}
