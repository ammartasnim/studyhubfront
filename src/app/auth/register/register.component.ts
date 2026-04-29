import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserContextService } from '../../user-context.service';
import { AuthFacadeService } from '../../api/facades';




@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacadeService);
  private readonly router = inject(Router);
  private readonly userContext = inject(UserContextService);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    userName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    phonenumber: [''],
    acceptTerms: [false, [Validators.requiredTrue]],
    pfp: [''],
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

    const payload = {
      firstName: rawValue.firstName,
      lastName: rawValue.lastName,
      email: rawValue.email,
      password: rawValue.password,
      username: rawValue.userName,
      pfp: rawValue.pfp || undefined,
      phoneNumber: rawValue.phonenumber || undefined
    };
    console.log('Registering user with payload:', payload);
    this.authFacade.register(payload).subscribe({
      next: (response) => {
        this.handleAuthSuccess(response);
      },
      error: (err) => {
        console.error('Registration error:', err.error?.message || err.message || err);
        this.isSubmitting.set(false);
          const errorMessage =    err.error?.message ||          
    err.error ||                  
    err.message ||                
    'An unexpected error occurred';  

        this.submitError.set(errorMessage || 'An error occurred during registration. Please try again.');
      }
    });
  }

  private handleAuthSuccess(response: any): void {
    this.finalizeAuthSuccess(response);
  }

  private async finalizeAuthSuccess(response: any): Promise<void> {
    const token = response?.token?.trim();
    if (!token) {
      localStorage.removeItem('token');
      this.userContext.clear();
      this.submitError.set('Registration succeeded, but authentication token is missing. Please sign in.');
      this.isSubmitting.set(false);
      await this.router.navigateByUrl('/auth/login');
      return;
    }

    localStorage.setItem('token', token);
    
    // Set user context with auth response data
    if (response.user?.id !== undefined && response.user?.email && response.user?.role) {
      this.userContext.setUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      } as any);
    }
    
    // Load full user data in background for complete profile
    void this.userContext.loadMe();
    
     const targetRoute = this.userContext.getDefaultRouteByRole();
     this.isSubmitting.set(false);
     await this.router.navigateByUrl(targetRoute);
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
