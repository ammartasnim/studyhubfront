import { Component, inject, output, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostFacadeService } from '../../api/facades/post.facade';
import { CommunityFacadeService, CommunityUI } from '../../api/facades';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-post-modal',
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
            <h2 class="text-xl font-bold text-slate-900">Create a New Post</h2>
            <button (click)="close()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="px-6 py-5 space-y-4">
            <!-- Title -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">Title</label>
              <input
                type="text"
                formControlName="title"
                placeholder="Give your post a title..."
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              @if (title.invalid && title.touched) {
                <p class="mt-1 text-sm text-red-600">Title is required (min 3 characters)</p>
              }
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">Description</label>
              <textarea
                formControlName="description"
                placeholder="Write your post content..."
                rows="5"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              ></textarea>
              @if (description.invalid && description.touched) {
                <p class="mt-1 text-sm text-red-600">Description is required (min 10 characters)</p>
              }
            </div>

            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">Images <span class="font-normal text-slate-400">(optional, up to 5)</span></label>

              <!-- Previews -->
              @if (imagePreviews().length > 0) {
                <div class="grid grid-cols-3 gap-2 mb-3">
                  @for (preview of imagePreviews(); track preview; let i = $index) {
                    <div class="relative rounded-lg overflow-hidden aspect-square bg-slate-100">
                      <img [src]="preview" alt="preview" class="w-full h-full object-cover" />
                      <button
                        type="button"
                        (click)="removeImage(i)"
                        class="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }

              <!-- Add images button (hidden when limit reached) -->
              @if (selectedImages().length < 5) {
                <label class="cursor-pointer inline-block">
                  <div class="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm font-medium">
                      Add images{{ selectedImages().length > 0 ? ' (' + selectedImages().length + '/5)' : '' }}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden"
                    (change)="addImages($event)"
                  />
                </label>
              }
            </div>

            <!-- Community Selection -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">Community <span class="font-normal text-slate-400">(optional)</span></label>
              <select
                formControlName="communityId"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a community...</option>
                @for (community of communities(); track community.id) {
                  <option [value]="community.id.toString()">{{ community.title }}</option>
                }
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
                  Create Post
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class CreatePostModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly postFacade = inject(PostFacadeService);
  private readonly communityFacade = inject(CommunityFacadeService);

  readonly isOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly communities = signal<CommunityUI[]>([]);
  readonly selectedImages = signal<File[]>([]);
  readonly imagePreviews = signal<string[]>([]);

  readonly postCreated = output<void>();
  readonly prefilledCommunityId = input<number | undefined>();

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    communityId: ['']
  });

  get title() { return this.form.get('title')!; }
  get description() { return this.form.get('description')!; }

  open(): void {
    this.isOpen.set(true);
    this.form.reset();
    this.submitError.set(null);
    this.selectedImages.set([]);
    this.imagePreviews.set([]);

    const prefilled = this.prefilledCommunityId();
    if (prefilled) {
      this.form.patchValue({ communityId: prefilled.toString() });
      this.form.get('communityId')?.disable();
    } else {
      this.form.get('communityId')?.enable();
    }

    this.loadCommunities();
  }

  private async loadCommunities(): Promise<void> {
    try {
      const result = await firstValueFrom(this.communityFacade.getMy({ size: 100 }));
      this.communities.set(result.items);
    } catch {
      this.communities.set([]);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  addImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const remaining = 5 - this.selectedImages().length;
    const newFiles = Array.from(input.files).slice(0, remaining);

    this.selectedImages.update(existing => [...existing, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this.imagePreviews.update(p => [...p, e.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(index: number): void {
    this.selectedImages.update(imgs => imgs.filter((_, i) => i !== index));
    this.imagePreviews.update(previews => previews.filter((_, i) => i !== index));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const formValue = this.form.getRawValue();
      const cId = formValue.communityId || this.prefilledCommunityId();

      await firstValueFrom(this.postFacade.create({
        title: formValue.title,
        content: formValue.description,
        communityId: cId ? Number(cId) : undefined,
        imgs: this.selectedImages().length > 0 ? this.selectedImages() : undefined
      }));

      this.postCreated.emit();
      this.close();
    } catch (error: any) {
      this.submitError.set(error.message || 'Failed to create post. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
