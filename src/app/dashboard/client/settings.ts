import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { UserContextService } from '../../user-context.service';
import { UserFacadeService } from '../../api/facades';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    .settings-container {
      font-family: 'DM Sans', sans-serif;
    }

    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    }

    .field-group {
      margin-bottom: 1rem;
    }
    .field-group:last-of-type {
      margin-bottom: 0;
    }

    .input-base {
      width: 100%;
      padding: 0.625rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .input-base:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgb(99 102 241 / 0.25);
    }
    .input-base:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }

    .input-error {
      border-color: #ef4444 !important;
    }
    .input-error:focus {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 2px rgb(239 68 68 / 0.25) !important;
    }

    .btn-save {
      background: linear-gradient(90deg, #4f46e5, #9333ea);
      color: #fff;
      border-radius: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-width: 120px;
      transition: opacity 0.15s;
    }
    .btn-save:hover { opacity: 0.9; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-cancel {
      border: 1px solid #cbd5e1;
      color: #334155;
      border-radius: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      background: #fff;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .btn-cancel:hover { background: #f8fafc; }
    .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

    .msg-success {
      color: #16a34a;
      background: #f0fdf4;
      border-radius: 0.5rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      margin-top: 0.75rem;
    }

    .msg-error {
      color: #dc2626;
      background: #fef2f2;
      border-radius: 0.5rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      margin-top: 0.75rem;
    }

    .validation-msg {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.375rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 9999px;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  template: `
    <div class="settings-container max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900" style="font-family: 'Syne', sans-serif;">Settings</h1>
        <p class="text-slate-500 mt-1">Manage your profile information and security</p>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Profile Information Form -->
        <div class="card">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">Profile Information</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- First Name -->
              <div class="field-group">
                <label class="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  formControlName="firstName"
                  type="text"
                  placeholder="Enter first name"
                  class="input-base"
                  [class.input-error]="profileForm.get('firstName')?.invalid && (profileForm.get('firstName')?.touched || profileInvalid)"
                />
                <div class="validation-msg" *ngIf="profileForm.get('firstName')?.invalid && (profileForm.get('firstName')?.touched || profileInvalid)">
                  <span *ngIf="profileForm.get('firstName')?.errors?.['required']">First name is required</span>
                </div>
              </div>

              <!-- Last Name -->
              <div class="field-group">
                <label class="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  formControlName="lastName"
                  type="text"
                  placeholder="Enter last name"
                  class="input-base"
                  [class.input-error]="profileForm.get('lastName')?.invalid && (profileForm.get('lastName')?.touched || profileInvalid)"
                />
                <div class="validation-msg" *ngIf="profileForm.get('lastName')?.invalid && (profileForm.get('lastName')?.touched || profileInvalid)">
                  <span *ngIf="profileForm.get('lastName')?.errors?.['required']">Last name is required</span>
                </div>
              </div>
            </div>

            <!-- Username -->
            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                formControlName="username"
                type="text"
                placeholder="Enter your username"
                class="input-base"
                [class.input-error]="profileForm.get('username')?.invalid && (profileForm.get('username')?.touched || profileInvalid)"
              />
              <div class="validation-msg" *ngIf="profileForm.get('username')?.invalid && (profileForm.get('username')?.touched || profileInvalid)">
                <span *ngIf="profileForm.get('username')?.errors?.['required']">Username is required</span>
                <span *ngIf="profileForm.get('username')?.errors?.['minlength']">Username must be at least 3 characters</span>
              </div>
            </div>

            <!-- Email -->
            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                formControlName="email"
                type="email"
                placeholder="Enter your email"
                class="input-base"
                [class.input-error]="profileForm.get('email')?.invalid && (profileForm.get('email')?.touched || profileInvalid)"
              />
              <div class="validation-msg" *ngIf="profileForm.get('email')?.invalid && (profileForm.get('email')?.touched || profileInvalid)">
                <span *ngIf="profileForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="profileForm.get('email')?.errors?.['email']">Email format is invalid</span>
              </div>
            </div>

            <!-- Phone -->
            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                formControlName="phone"
                type="tel"
                placeholder="Enter your phone number (optional)"
                class="input-base"
                [class.input-error]="profileForm.get('phone')?.invalid && (profileForm.get('phone')?.touched || profileInvalid)"
              />
              <div class="validation-msg" *ngIf="profileForm.get('phone')?.invalid && (profileForm.get('phone')?.touched || profileInvalid)">
                <span *ngIf="profileForm.get('phone')?.errors?.['pattern']">Phone format is invalid</span>
              </div>
            </div>

            <div class="flex gap-3 mt-5">
              <button type="button" class="btn-cancel" (click)="cancelProfile()" [disabled]="profileSaving()">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="profileSaving() || profileForm.invalid">
                <span class="spinner" *ngIf="profileSaving()"></span>
                {{ profileSaving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
            <div class="msg-success" *ngIf="profileSuccess()">{{ profileSuccess() }}</div>
            <div class="msg-error" *ngIf="profileError()">{{ profileError() }}</div>
          </form>
        </div>

        <!-- Change Password Form -->
        <div class="card">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">Change Password</h2>
          <form [formGroup]="passwordForm" (ngSubmit)="savePassword()">

            <!-- Current Password -->
            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input
                formControlName="currentPassword"
                type="password"
                placeholder="Enter current password"
                class="input-base"
                [class.input-error]="passwordForm.get('currentPassword')?.invalid && (passwordForm.get('currentPassword')?.touched || passwordInvalid)"
              />
              <div class="validation-msg" *ngIf="passwordForm.get('currentPassword')?.invalid && (passwordForm.get('currentPassword')?.touched || passwordInvalid)">
                <span *ngIf="passwordForm.get('currentPassword')?.errors?.['required']">Current password is required</span>
                <span *ngIf="passwordForm.get('currentPassword')?.errors?.['minlength']">Password must be at least 6 characters</span>
              </div>
            </div>

            <!-- New Password -->
            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                formControlName="newPassword"
                type="password"
                placeholder="Enter new password"
                class="input-base"
                [class.input-error]="passwordForm.get('newPassword')?.invalid && (passwordForm.get('newPassword')?.touched || passwordInvalid)"
              />
              <div class="validation-msg" *ngIf="passwordForm.get('newPassword')?.invalid && (passwordForm.get('newPassword')?.touched || passwordInvalid)">
                <span *ngIf="passwordForm.get('newPassword')?.errors?.['required']">New password is required</span>
                <span *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Password must be at least 6 characters</span>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                formControlName="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                class="input-base"
                [class.input-error]="passwordForm.get('confirmPassword')?.invalid && (passwordForm.get('confirmPassword')?.touched || passwordInvalid)"
              />
              <div class="validation-msg" *ngIf="passwordForm.get('confirmPassword')?.invalid && (passwordForm.get('confirmPassword')?.touched || passwordInvalid)">
                <span *ngIf="passwordForm.get('confirmPassword')?.errors?.['required']">Confirmation is required</span>
                <span *ngIf="passwordForm.get('confirmPassword')?.errors?.['passwordMismatch']">Passwords do not match</span>
              </div>
            </div>

            <div class="flex gap-3 mt-5">
              <button type="button" class="btn-cancel" (click)="cancelPassword()" [disabled]="passwordSaving()">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="passwordSaving() || passwordForm.invalid">
                <span class="spinner" *ngIf="passwordSaving()"></span>
                {{ passwordSaving() ? 'Saving...' : 'Change Password' }}
              </button>
            </div>
            <div class="msg-success" *ngIf="passwordSuccess()">{{ passwordSuccess() }}</div>
            <div class="msg-error" *ngIf="passwordError()">{{ passwordError() }}</div>
          </form>
        </div>

      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userContext = inject(UserContextService);
  private readonly userFacade = inject(UserFacadeService);

  // Forms
  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)]]
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
  }, { validators: this.passwordMatchValidator() });

  // Original values for cancel
  firstNameOriginal = signal('');
  lastNameOriginal = signal('');
  usernameOriginal = signal('');
  emailOriginal = signal('');
  phoneOriginal = signal('');

  // Loading states
  profileSaving = signal(false);
  passwordSaving = signal(false);

  // Success messages
  profileSuccess = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);

  // Error messages
  profileError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  // Flags for inline validation trigger
  profileInvalid = false;
  passwordInvalid = false;

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    const user = this.userContext.user();
    if (user) {
      this.firstNameOriginal.set(user.firstName ?? '');
      this.lastNameOriginal.set(user.lastName ?? '');
      this.usernameOriginal.set(user.username ?? '');
      this.emailOriginal.set(user.email ?? '');
      this.phoneOriginal.set(user.phone ?? '');

      this.profileForm.patchValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        phone: user.phone ?? ''
      });
    }
  }

  // ── Profile ──
  async saveProfile(): Promise<void> {
    this.profileError.set(null);
    this.profileSuccess.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.profileInvalid = true;
      return;
    }

    const raw = this.profileForm.getRawValue();
    const hasChanges =
      raw.firstName !== this.firstNameOriginal() ||
      raw.lastName !== this.lastNameOriginal() ||
      raw.username !== this.usernameOriginal() ||
      raw.email !== this.emailOriginal() ||
      raw.phone !== this.phoneOriginal();

    if (!hasChanges) {
      this.profileSuccess.set('No changes to save');
      return;
    }

    this.profileSaving.set(true);

    const dto: any = {};
    if (raw.firstName !== this.firstNameOriginal()) dto.firstName = raw.firstName;
    if (raw.lastName !== this.lastNameOriginal()) dto.lastName = raw.lastName;
    if (raw.username !== this.usernameOriginal()) dto.username = raw.username;
    if (raw.email !== this.emailOriginal()) dto.email = raw.email;
    if (raw.phone !== this.phoneOriginal()) dto.phone = raw.phone;

    this.userFacade.editMe(dto).subscribe({
      next: async () => {
        this.profileSaving.set(false);
        this.profileSuccess.set('Profile updated successfully');
        this.firstNameOriginal.set(raw.firstName);
        this.lastNameOriginal.set(raw.lastName);
        this.usernameOriginal.set(raw.username);
        this.emailOriginal.set(raw.email);
        this.phoneOriginal.set(raw.phone);
        this.profileForm.markAsPristine();
        await this.refreshUserContext();
      },
      error: (err) => {
        this.profileSaving.set(false);
        this.profileError.set(err?.error?.message || err?.message || 'Failed to update profile');
      }
    });
  }

  cancelProfile(): void {
    this.profileForm.patchValue({
      firstName: this.firstNameOriginal(),
      lastName: this.lastNameOriginal(),
      username: this.usernameOriginal(),
      email: this.emailOriginal(),
      phone: this.phoneOriginal()
    });
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
    this.profileError.set(null);
    this.profileSuccess.set(null);
    this.profileInvalid = false;
  }

  // ── Password ──
  savePassword(): void {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordInvalid = true;
      return;
    }

    const currentPassword = this.passwordForm.get('currentPassword')?.value ?? '';
    const newPassword = this.passwordForm.get('newPassword')?.value ?? '';
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value ?? '';

    this.passwordSaving.set(true);
    this.userFacade.editPassword(currentPassword, newPassword, confirmPassword).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSuccess.set('Password changed successfully');
        this.cancelPassword();
      },
      error: (err) => {
        this.passwordSaving.set(false);
        this.passwordError.set(err?.error?.message || err?.message || 'Failed to change password');
      }
    });
  }

  cancelPassword(): void {
    this.passwordForm.reset();
    this.passwordForm.markAsPristine();
    this.passwordForm.markAsUntouched();
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.passwordInvalid = false;
  }

  // ── Helpers ──
  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const newPassword = control.get('newPassword')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (!newPassword || !confirmPassword) return null;
      return newPassword === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  private async refreshUserContext(): Promise<void> {
    try {
      await this.userContext.loadMe();
    } catch (error) {
      console.error('[SettingsComponent] Failed to refresh user context:', error);
    }
  }
}
