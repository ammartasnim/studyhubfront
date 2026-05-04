import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommunityFacadeService } from '../../api/facades/community.facade';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-community-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 z-40" (click)="close()"></div>

      <!-- Modal -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Create a New Community</h2>
            <button
              (click)="close()"
              class="text-slate-400 hover:text-slate-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="px-6 py-5 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">Community Name</label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g., Web Development, Data Science..."
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              @if (name.invalid && name.touched) {
                <p class="mt-1 text-sm text-red-600">Name is required and must be at least 3 characters</p>
              }
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">Description</label>
              <textarea
                formControlName="description"
                placeholder="Describe what this community is about..."
                rows="4"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              ></textarea>
              @if (description.invalid && description.touched) {
                <p class="mt-1 text-sm text-red-600">Description is required</p>
              }
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">Category</label>
              <select
                formControlName="category"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a category...</option>
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="science">Science</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Error Message -->
            @if (submitError()) {
              <div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {{ submitError() }}
              </div>
            }

            <!-- Buttons -->
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                (click)="close()"
                class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSubmitting() || form.invalid"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2"
              >
                @if (isSubmitting()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Community
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class CreateCommunityModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly communityFacade = inject(CommunityFacadeService);

  readonly isOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly communityCreated = output<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['', Validators.required]
  });

  get name() {
    return this.form.get('name')!;
  }

  get description() {
    return this.form.get('description')!;
  }

  open(): void {
    console.log('[CreateCommunityModal] Opening modal');
    this.isOpen.set(true);
    this.form.reset();
    this.submitError.set(null);
  }

  close(): void {
    console.log('[CreateCommunityModal] Closing modal');
    this.isOpen.set(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const formValue = this.form.getRawValue();
      console.log('[CreateCommunityModal] Submitting community:', formValue);

      // Using facade service - clean and simple
      await firstValueFrom(this.communityFacade.create({
        title: formValue.name,
        description: formValue.description,
        category: formValue.category 
      }));

      console.log('[CreateCommunityModal] Community created successfully');
      this.communityCreated.emit();
      this.close();
    } catch (error: any) {
      console.error('[CreateCommunityModal] Error creating community:', error.error);
      const errorMessage = 
    error.error?.message ||          
    error.error ||                  
    error.message ||                
    'An unexpected error occurred';  

 
  this.submitError.set(errorMessage);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
