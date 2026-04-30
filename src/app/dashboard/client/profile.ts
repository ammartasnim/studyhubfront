import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContextService } from '../../user-context.service';
import { BadgesDisplayComponent } from '../Nav/badges-display.';
import { UserFacadeService } from '../../api/facades/user.facade';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BadgesDisplayComponent],
  template: `
    <article class="relative rounded-3xl overflow-hidden bg-white shadow-sm ring-1 ring-indigo-500/10">

      <!-- Banner -->
      <div
        class="relative h-44 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 overflow-hidden cursor-pointer group"
        (click)="openModal()"
      >
        <div class="absolute -top-10 -left-8 w-40 h-40 rounded-full bg-indigo-400 blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute top-2 right-10 w-28 h-28 rounded-full bg-fuchsia-400 blur-3xl opacity-30 animate-pulse delay-300"></div>
        <div class="absolute -bottom-4 left-1/2 w-20 h-20 rounded-full bg-purple-400 blur-2xl opacity-30 animate-pulse delay-700"></div>
      </div>

      <!-- Body -->
      <div class="px-8 pb-8">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-11">
          <div class="flex flex-col gap-4">
            <div class="flex items-end gap-5">

              <!-- Avatar -->
              <div
                class="relative w-28 h-28 flex-shrink-0 cursor-pointer group/avatar"
                (click)="openModal()"
              >
                <div class="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 z-0"></div>
                <div class="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-md opacity-50 z-[-1]"></div>
                <div class="relative z-10 w-full h-full rounded-[1.1rem] overflow-hidden bg-indigo-100">
                  <div class="absolute inset-0 z-20 flex items-center justify-center bg-black/0 group-hover/avatar:bg-black/40 transition-all duration-200 rounded-[1.1rem]">
                    <span class="text-2xl opacity-0 group-hover/avatar:opacity-100 transition-all duration-200">📷</span>
                  </div>
                  @if (pfp()) {
                    <img [src]="pfp()" [alt]="displayName()" class="w-full h-full object-cover" />
                  } @else {
                    <div class="flex items-center justify-center h-full bg-gradient-to-br from-indigo-500 to-purple-500">
                      <span class="text-white text-3xl font-extrabold tracking-tight">{{ initials() }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Name + chips -->
              <div class="pb-1">
                <p class="text-[0.65rem] font-semibold tracking-[0.22em] uppercase bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-1">
                  Profile
                </p>
                <h2 class="text-3xl font-extrabold tracking-tighter text-slate-900 leading-tight mb-2">
                  {{ displayName() }}
                </h2>
                <div class="flex flex-wrap gap-1.5">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                    &#64;{{ username() }}
                  </span>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-200">
                    Lv.&nbsp;{{ level() }}
                  </span>
                  
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- XP bar -->
        <div class="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent my-5"></div>
        <div class="flex justify-between text-[0.7rem] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
          <span>Experience</span>
          <span>{{ xp().toLocaleString() }} XP</span>
        </div>
        <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-[length:200%] animate-[flow_2.5s_linear_infinite] transition-all duration-500"
            [style.width]="xpPercent() + '%'"
          ></div>
        </div>

        <!-- Badges -->
        <div class="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent my-5"></div>
        <app-badges-display [badges]="badges()" />
      </div>
    </article>

    <!-- Upload Modal -->
    @if (modalOpen()) {
      <div
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.15s_ease]"
        (click)="closeModal()"
      >
        <div
          class="bg-white rounded-2xl p-8 w-[min(420px,90vw)] shadow-2xl animate-[slideUp_0.2s_ease]"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-xl font-extrabold text-slate-900 mb-1">Upload Profile Picture</h3>
          <p class="text-sm text-slate-400 mb-6">JPG, PNG or WebP · Max 5MB</p>

          <!-- Error -->
          @if (errorMsg()) {
            <div class="mb-4 px-4 py-3 rounded-xl bg-red-50 ring-1 ring-red-200 text-sm text-red-600">
              {{ errorMsg() }}
            </div>
          }

          <!-- Drop zone -->
          <label
            class="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-indigo-200 rounded-xl p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 group"
            for="pfp-input"
          >
            <span class="text-4xl group-hover:scale-110 transition-transform duration-200">🖼️</span>
            <div class="text-center">
              <p class="text-sm font-semibold text-slate-700">Click to browse</p>
              <p class="text-xs text-slate-400 mt-0.5">or drag and drop your image here</p>
            </div>
            <input
              id="pfp-input"
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onFileSelected($event)"
            />
          </label>

          <!-- Preview -->
          @if (previewUrl()) {
            <div class="mt-5 flex items-center gap-4 p-3 bg-slate-50 rounded-xl ring-1 ring-slate-100">
              <img [src]="previewUrl()!" class="w-14 h-14 rounded-xl object-cover" alt="Preview" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-700 truncate">{{ selectedFile()?.name }}</p>
                <p class="text-xs text-slate-400">{{ fileSizeLabel() }}</p>
              </div>
              <button
                (click)="clearFile()"
                class="text-slate-400 hover:text-red-400 transition-colors text-lg leading-none"
              >✕</button>
            </div>
          }

          <!-- Actions -->
          <div class="flex gap-3 mt-6">
            <button
              (click)="closeModal()"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              [disabled]="!selectedFile() || uploading()"
              (click)="uploadPfp()"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              @if (uploading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Uploading...
                </span>
              } @else {
                Upload
              }
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes flow {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `]
})
export class ProfileComponent {
  private readonly userContext = inject(UserContextService);
  private readonly userFacade  = inject(UserFacadeService);
  readonly user = this.userContext.user;

  readonly modalOpen    = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl   = signal<string | null>(null);
  readonly uploading    = signal(false);
  readonly errorMsg     = signal<string | null>(null);
  readonly localPfp     = signal<string | null>(null); // ← overrides after upload

  openModal()  { this.modalOpen.set(true); this.errorMsg.set(null); }
  closeModal() { this.modalOpen.set(false); this.clearFile(); this.errorMsg.set(null); }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    this.errorMsg.set(null);
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  clearFile() {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  fileSizeLabel(): string {
    const size = this.selectedFile()?.size ?? 0;
    return size < 1024 * 1024
      ? (size / 1024).toFixed(1) + ' KB'
      : (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  uploadPfp() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.errorMsg.set(null);

    this.userFacade.uploadPfp(file).subscribe({
      next: (updatedUser) => {
        this.userContext.setUser(updatedUser);
        // ← immediately show the new pfp using the blob URL
        const newPfp = updatedUser.pfp
          ? `http://localhost:8081/uploads/${updatedUser.pfp}`
          : null;
        this.localPfp.set(newPfp);
        this.uploading.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.errorMsg.set(err?.message ?? 'Upload failed, please try again.');
        this.uploading.set(false);
      }
    });
  }

  // ── Computed ──
  readonly displayName = computed(() => {
    const u = this.user();
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.username || 'Student';
  });

  readonly username  = computed(() => this.user()?.username ?? '');
  readonly roleLabel = computed(() => this.user()?.role ?? '');
  readonly level     = computed(() => this.user()?.level ?? 1);

  // localPfp takes priority over user context pfp
  readonly pfp = computed(() => {
    if (this.localPfp()) return this.localPfp()!;
    const p = this.user()?.pfp;
    if (!p) return undefined;
    return `http://localhost:8081/uploads/${p}`;
  });

  readonly xp        = computed(() => this.user()?.xpPts ?? 0);
  readonly badges    = computed(() => this.user()?.badges ?? []);
  readonly xpPercent = computed(() => Math.min(100, (this.xp() % 5000) / 50));

  initials(): string {
    const parts = this.displayName().trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : this.displayName().substring(0, 2).toUpperCase();
  }
}