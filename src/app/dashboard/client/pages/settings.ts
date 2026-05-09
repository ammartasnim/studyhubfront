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

import { UserContextService } from '../../../services/user-context.service';
import { UserFacadeService } from '../../../api/facades';
import { FriendshipFacadeService } from '../../../api/facades/friendship.facade';
import { PostFacadeService, ReportResDto } from '../../../api/facades/post.facade';
import { UserSummaryUI } from '../../../api/facades/models/friendship.model';
import { PaginationComponent, PaginationConfig } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    .settings-container { font-family: 'DM Sans', sans-serif; }

    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    }

    .field-group { margin-bottom: 1rem; }
    .field-group:last-of-type { margin-bottom: 0; }

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
    .input-base:disabled { background: #f1f5f9; cursor: not-allowed; }

    .input-error { border-color: #ef4444 !important; }
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

    .validation-msg { color: #ef4444; font-size: 0.75rem; margin-top: 0.375rem; }

    .spinner {
      width: 1rem; height: 1rem;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 9999px;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .status-pending  { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .status-approved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
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
              <div class="field-group">
                <label class="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input formControlName="firstName" type="text" placeholder="Enter first name" class="input-base"
                  [class.input-error]="profileForm.get('firstName')?.invalid && (profileForm.get('firstName')?.touched || profileInvalid)" />
                <div class="validation-msg" *ngIf="profileForm.get('firstName')?.invalid && (profileForm.get('firstName')?.touched || profileInvalid)">
                  <span *ngIf="profileForm.get('firstName')?.errors?.['required']">First name is required</span>
                </div>
              </div>
              <div class="field-group">
                <label class="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input formControlName="lastName" type="text" placeholder="Enter last name" class="input-base"
                  [class.input-error]="profileForm.get('lastName')?.invalid && (profileForm.get('lastName')?.touched || profileInvalid)" />
                <div class="validation-msg" *ngIf="profileForm.get('lastName')?.invalid && (profileForm.get('lastName')?.touched || profileInvalid)">
                  <span *ngIf="profileForm.get('lastName')?.errors?.['required']">Last name is required</span>
                </div>
              </div>
            </div>

            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input formControlName="username" type="text" placeholder="Enter your username" class="input-base"
                [class.input-error]="profileForm.get('username')?.invalid && (profileForm.get('username')?.touched || profileInvalid)" />
              <div class="validation-msg" *ngIf="profileForm.get('username')?.invalid && (profileForm.get('username')?.touched || profileInvalid)">
                <span *ngIf="profileForm.get('username')?.errors?.['required']">Username is required</span>
                <span *ngIf="profileForm.get('username')?.errors?.['minlength']">Username must be at least 3 characters</span>
              </div>
            </div>

            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input formControlName="email" type="email" placeholder="Enter your email" class="input-base"
                [class.input-error]="profileForm.get('email')?.invalid && (profileForm.get('email')?.touched || profileInvalid)" />
              <div class="validation-msg" *ngIf="profileForm.get('email')?.invalid && (profileForm.get('email')?.touched || profileInvalid)">
                <span *ngIf="profileForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="profileForm.get('email')?.errors?.['email']">Email format is invalid</span>
              </div>
            </div>

            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input formControlName="phone" type="tel" placeholder="Enter your phone number (optional)" class="input-base"
                [class.input-error]="profileForm.get('phone')?.invalid && (profileForm.get('phone')?.touched || profileInvalid)" />
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
            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input formControlName="currentPassword" type="password" placeholder="Enter current password" class="input-base"
                [class.input-error]="passwordForm.get('currentPassword')?.invalid && (passwordForm.get('currentPassword')?.touched || passwordInvalid)" />
              <div class="validation-msg" *ngIf="passwordForm.get('currentPassword')?.invalid && (passwordForm.get('currentPassword')?.touched || passwordInvalid)">
                <span *ngIf="passwordForm.get('currentPassword')?.errors?.['required']">Current password is required</span>
                <span *ngIf="passwordForm.get('currentPassword')?.errors?.['minlength']">Password must be at least 6 characters</span>
              </div>
            </div>

            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input formControlName="newPassword" type="password" placeholder="Enter new password" class="input-base"
                [class.input-error]="passwordForm.get('newPassword')?.invalid && (passwordForm.get('newPassword')?.touched || passwordInvalid)" />
              <div class="validation-msg" *ngIf="passwordForm.get('newPassword')?.invalid && (passwordForm.get('newPassword')?.touched || passwordInvalid)">
                <span *ngIf="passwordForm.get('newPassword')?.errors?.['required']">New password is required</span>
                <span *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Password must be at least 6 characters</span>
              </div>
            </div>

            <div class="field-group">
              <label class="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input formControlName="confirmPassword" type="password" placeholder="Confirm new password" class="input-base"
                [class.input-error]="passwordForm.get('confirmPassword')?.invalid && (passwordForm.get('confirmPassword')?.touched || passwordInvalid)" />
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

      <!-- Blocked Users -->
      <div class="mt-6 card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Blocked Users</h2>
          <span class="text-xs text-slate-400">{{ blockedPaginationConfig().totalElements }} total</span>
        </div>

        @if (blockedLoading()) {
          <div class="flex justify-center py-6">
            <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        } @else if (blockedError()) {
          <div class="msg-error">{{ blockedError() }}</div>
        } @else if (blockedUsers().length === 0) {
          <div class="text-center py-6 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
            <p class="text-slate-400 text-sm">No blocked users.</p>
          </div>
        } @else {
          <div class="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            @for (user of blockedUsers(); track user.id) {
              <div class="px-5 py-4 flex items-center gap-4">
                <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                  @if (user.pfp) {
                    <img [src]="blockedAvatarUrl(user.pfp)" [alt]="blockedName(user)" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-slate-600 font-semibold text-sm">{{ blockedInitials(user) }}</span>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-900 truncate">{{ blockedName(user) }}</p>
                  <p class="text-sm text-slate-500 truncate">@{{ user.username || 'unknown' }}</p>
                </div>
                <button class="px-4 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
                  (click)="unblockUser(user.id)">Unblock</button>
              </div>
            }
          </div>
        }

        <div class="border-t border-slate-200 bg-slate-50 p-4 mt-4">
          <app-pagination
            [config]="blockedPaginationConfig()"
            [isLoading]="blockedLoading()"
            (pageChange)="onBlockedPageChange($event)"
            (pageSizeChange)="onBlockedPageSizeChange($event)"
          ></app-pagination>
        </div>
      </div>

      <!-- My Reports -->
      <div class="mt-6 card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">My Reports</h2>
            <p class="text-xs text-slate-400 mt-0.5">Reports you have submitted</p>
          </div>
          <span class="text-xs text-slate-400">{{ reportsPaginationConfig().totalElements }} total</span>
        </div>

        @if (reportsLoading()) {
          <div class="flex justify-center py-6">
            <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        } @else if (reportsError()) {
          <div class="msg-error">{{ reportsError() }}</div>
        } @else if (myReports().length === 0) {
          <div class="text-center py-6 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
            <p class="text-slate-400 text-sm">You haven't submitted any reports yet.</p>
          </div>
        } @else {
          <div class="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            @for (report of myReports(); track report.id) {
              <div class="px-5 py-4 flex items-start gap-4">

                <!-- Icon -->
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  [class.bg-indigo-50]="report.targetType.toString() === 'POST'"
                  [class.bg-amber-50]="report.targetType.toString() === 'COMMENT'">
                  @if (report.targetType.toString() === 'POST') {
                    <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  } @else {
                    <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class.bg-indigo-50]="report.targetType.toString() === 'POST'"
                      [class.text-indigo-600]="report.targetType.toString() === 'POST'"
                      [class.bg-amber-50]="report.targetType.toString() === 'COMMENT'"
                      [class.text-amber-600]="report.targetType.toString() === 'COMMENT'">
                      {{ report.targetType }}
                    </span>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class.status-pending]="report.status.toString() === 'PENDING'"
                      [class.status-approved]="report.status.toString() === 'APPROVED'"
                      [class.status-rejected]="report.status.toString() === 'REJECTED'">
                      {{ report.status }}
                    </span>
                    <span class="text-xs text-slate-400">{{ getTimeAgo(report.createdAt) }}</span>
                  </div>
                  <p class="text-sm font-medium text-slate-800 truncate">{{ report.targetPreview }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">Reason: <span class="font-medium text-slate-700">{{ formatReason(report.reason.toString()) }}</span></p>
                  @if (report.additionalContext) {
                    <p class="text-xs text-slate-400 mt-0.5 italic">"{{ report.additionalContext }}"</p>
                  }
                </div>

              </div>
            }
          </div>
        }

        <div class="border-t border-slate-200 bg-slate-50 p-4 mt-4">
          <app-pagination
            [config]="reportsPaginationConfig()"
            [isLoading]="reportsLoading()"
            (pageChange)="onReportsPageChange($event)"
            (pageSizeChange)="onReportsPageSizeChange($event)"
          ></app-pagination>
        </div>
      </div>

    </div>
  `
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userContext = inject(UserContextService);
  private readonly userFacade = inject(UserFacadeService);
  private readonly friendshipFacade = inject(FriendshipFacadeService);
  private readonly postFacade = inject(PostFacadeService);

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

  // Original values
  firstNameOriginal = signal('');
  lastNameOriginal  = signal('');
  usernameOriginal  = signal('');
  emailOriginal     = signal('');
  phoneOriginal     = signal('');

  // Loading/status
  profileSaving  = signal(false);
  passwordSaving = signal(false);
  profileSuccess = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  profileError   = signal<string | null>(null);
  passwordError  = signal<string | null>(null);
  profileInvalid = false;
  passwordInvalid = false;

  // Blocked users
  blockedUsers            = signal<UserSummaryUI[]>([]);
  blockedLoading          = signal(false);
  blockedError            = signal<string | null>(null);
  blockedPaginationConfig = signal<PaginationConfig>({
    totalPages: 0, totalElements: 0, currentPage: 0,
    pageSize: 10, hasNext: false, hasPrevious: false
  });

  // My Reports
  myReports              = signal<ReportResDto[]>([]);
  reportsLoading         = signal(false);
  reportsError           = signal<string | null>(null);
  reportsPaginationConfig = signal<PaginationConfig>({
    totalPages: 0, totalElements: 0, currentPage: 0,
    pageSize: 10, hasNext: false, hasPrevious: false
  });

  ngOnInit(): void {
    this.initializeForms();
    this.loadBlockedUsers(0, this.blockedPaginationConfig().pageSize);
    this.loadMyReports(0, this.reportsPaginationConfig().pageSize);
  }

  // ── My Reports ─────────────────────────────────────────────────────────────

  private loadMyReports(page: number, size: number) {
    this.reportsLoading.set(true);
    this.reportsError.set(null);
    this.postFacade.getMyReports(page, size).subscribe({
      next: res => {
        this.myReports.set(res.items);
        this.reportsPaginationConfig.set({
          currentPage: res.currentPage,
          pageSize: res.pageSize,
          totalElements: res.totalItems,
          totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.reportsLoading.set(false);
      },
      error: err => {
        this.reportsError.set(err?.message || 'Failed to load reports.');
        this.reportsLoading.set(false);
      }
    });
  }

  onReportsPageChange(page: number) { this.loadMyReports(page, this.reportsPaginationConfig().pageSize); }
  onReportsPageSizeChange(size: number) { this.loadMyReports(0, size); }

  formatReason(reason: string): string {
    return reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  getTimeAgo(date: string | null | undefined): string {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  // ── Blocked Users ──────────────────────────────────────────────────────────

  private loadBlockedUsers(page: number, size: number) {
    this.blockedLoading.set(true);
    this.blockedError.set(null);
    this.friendshipFacade.getBlockedUsers({ page: Math.max(0, page), size }).subscribe({
      next: res => {
        this.blockedUsers.set(res.items);
        this.blockedPaginationConfig.set({
          currentPage: res.currentPage, pageSize: res.pageSize,
          totalElements: res.totalItems, totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.blockedLoading.set(false);
      },
      error: err => {
        this.blockedError.set(err?.message || 'Failed to load blocked users.');
        this.blockedLoading.set(false);
      }
    });
  }

  unblockUser(userId: number) {
    if (!userId || !confirm('Unblock this user?')) return;
    this.friendshipFacade.unblockUser(userId).subscribe({
      next: () => this.blockedUsers.update(list => list.filter(u => u.id !== userId)),
      error: err => console.error('[Settings] Failed to unblock user', err)
    });
  }

  onBlockedPageChange(page: number) { this.loadBlockedUsers(page, this.blockedPaginationConfig().pageSize); }
  onBlockedPageSizeChange(size: number) { this.loadBlockedUsers(0, size); }

  blockedName(user: UserSummaryUI): string {
    return user.fullName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || `User #${user.id}`;
  }

  blockedInitials(user: UserSummaryUI): string {
    const name = this.blockedName(user);
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }

  blockedAvatarUrl(pfp?: string | null): string {
    if (!pfp) return '';
    if (pfp.startsWith('http://') || pfp.startsWith('https://')) return pfp;
    if (pfp.startsWith('/uploads/')) return `http://localhost:8081${pfp}`;
    return `http://localhost:8081/uploads/${pfp}`;
  }

  // ── Profile ────────────────────────────────────────────────────────────────

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
      raw.lastName  !== this.lastNameOriginal()  ||
      raw.username  !== this.usernameOriginal()  ||
      raw.email     !== this.emailOriginal()     ||
      raw.phone     !== this.phoneOriginal();
    if (!hasChanges) { this.profileSuccess.set('No changes to save'); return; }
    this.profileSaving.set(true);
    const dto: any = {};
    if (raw.firstName !== this.firstNameOriginal()) dto.firstName = raw.firstName;
    if (raw.lastName  !== this.lastNameOriginal())  dto.lastName  = raw.lastName;
    if (raw.username  !== this.usernameOriginal())  dto.username  = raw.username;
    if (raw.email     !== this.emailOriginal())     dto.email     = raw.email;
    if (raw.phone     !== this.phoneOriginal())     dto.phone     = raw.phone;
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
      error: err => {
        this.profileSaving.set(false);
        this.profileError.set(err?.error?.message || err?.message || 'Failed to update profile');
      }
    });
  }

  cancelProfile(): void {
    this.profileForm.patchValue({
      firstName: this.firstNameOriginal(), lastName: this.lastNameOriginal(),
      username: this.usernameOriginal(), email: this.emailOriginal(), phone: this.phoneOriginal()
    });
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
    this.profileError.set(null);
    this.profileSuccess.set(null);
    this.profileInvalid = false;
  }

  // ── Password ───────────────────────────────────────────────────────────────

  savePassword(): void {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordInvalid = true;
      return;
    }
    const currentPassword  = this.passwordForm.get('currentPassword')?.value ?? '';
    const newPassword      = this.passwordForm.get('newPassword')?.value ?? '';
    const confirmPassword  = this.passwordForm.get('confirmPassword')?.value ?? '';
    this.passwordSaving.set(true);
    this.userFacade.editPassword(currentPassword, newPassword, confirmPassword).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSuccess.set('Password changed successfully');
        this.cancelPassword();
      },
      error: err => {
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const newPassword     = control.get('newPassword')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (!newPassword || !confirmPassword) return null;
      return newPassword === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  private async refreshUserContext(): Promise<void> {
    try { await this.userContext.loadMe(); }
    catch (error) { console.error('[SettingsComponent] Failed to refresh user context:', error); }
  }
}