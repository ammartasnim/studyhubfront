import {
  Component, OnInit, OnDestroy, inject, signal, computed ,ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatePostModalComponent } from '../modals/create-post';
import { CreateCommunityModalComponent } from '../modals/create-community';
import { PostCardComponent } from '../modals/posts';
import { FeedService } from '../../../services/feed.service';


@Component({
  selector: 'app-academic-feed',
  standalone: true,
  imports: [
    CommonModule,
    CreatePostModalComponent,
    CreateCommunityModalComponent,
    PostCardComponent
  ],
  template: `
    <app-create-post-modal #createPostModal (postCreated)="onPostCreated()" />
    <app-create-community-modal #createCommunityModal (communityCreated)="onCommunityCreated()" />

    <div class="flex flex-col gap-5">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              aria-label="Search feed"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              class="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <button
            (click)="openCreatePost()"
            class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </button>
          <button
            (click)="openCreateCommunity()"
            class="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            New Community
          </button>
        </div>
      </div>

      <!-- Feed Section -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
          <h2 class="text-xl font-bold text-slate-900">Academic Feed</h2>
        </div>

        @if (feedService.isLoading()) {
          <div class="p-6 flex flex-col gap-4">
            @for (i of [1, 2, 3]; track i) {
              <div class="animate-pulse rounded-xl border border-slate-100 p-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                    <div class="h-3 bg-slate-100 rounded w-24"></div>
                  </div>
                </div>
                <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-slate-100 rounded w-full mb-1"></div>
                <div class="h-3 bg-slate-100 rounded w-5/6"></div>
              </div>
            }
          </div>
        }

        @else if (feedService.error()) {
          <div class="px-6 py-10 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="font-medium text-slate-700">Failed to load feed</p>
            <p class="text-sm text-slate-500 mt-1">{{ feedService.error() }}</p>
            <button (click)="feedService.loadFeed()" class="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Try again
            </button>
          </div>
        }

        @else if (filteredPosts().length === 0) {
          <div class="px-6 py-10 text-center text-slate-500">
            @if (searchQuery()) {
              <p class="text-lg font-medium text-slate-700">No results for "{{ searchQuery() }}"</p>
              <p class="mt-2 text-sm">Try a different search term.</p>
            } @else {
              <p class="text-lg font-medium text-slate-700">Nothing in your feed yet</p>
              <p class="mt-2 text-sm">Join communities to see posts here, or be the first to share something!</p>
              <button (click)="openCreatePost()" class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create First Post
              </button>
            }
          </div>
        }

        @else {
          <div class="divide-y divide-slate-100">
            @for (post of filteredPosts(); track post.id) {
              <app-post-card
                [post]="post"
                [showLike]="true"
                [showComments]="true"
                [showReport]="true"
                [showCommunity]="true"
                (postDeleted)="onPostDeleted($event)"
              />
            }
          </div>

          @if (feedService.isLoadingMore()) {
            <div class="py-6 flex justify-center">
              <svg class="w-6 h-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
          } @else if (!feedService.hasMore() && filteredPosts().length > 0) {
            <p class="text-center text-xs text-slate-400 py-4">You've reached the end</p>
          }
        }
      </section>
    </div>
  `
})
export class FeedComponent implements OnInit, OnDestroy {
  @ViewChild('createPostModal')      createPostModal!: CreatePostModalComponent;
  @ViewChild('createCommunityModal') createCommunityModal!: CreateCommunityModalComponent;

  readonly feedService = inject(FeedService);

  readonly searchQuery = signal('');

  private scrollListener = () => this.checkScroll();

  readonly filteredPosts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const posts = this.feedService.posts();
    if (!q) return posts;
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.authorFullName.toLowerCase().includes(q) ||
      p.communityTitle.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.feedService.init();
    window.addEventListener('scroll', this.scrollListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollListener);
  }

  private checkScroll(): void {
    if (this.feedService.isLoading() || this.feedService.isLoadingMore() || !this.feedService.hasMore()) return;
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 300) {
      this.feedService.loadMorePosts();
    }
  }

  openCreatePost():      void { this.createPostModal.open(); }
  openCreateCommunity(): void { this.createCommunityModal.open(); }
  onPostCreated():       void { this.feedService.loadFeed(); }
  onCommunityCreated():  void { this.feedService.checkCommunities(); }

  onPostDeleted(postId: number): void {
    this.feedService.posts.update(list => list.filter(p => p.id !== postId));
  }
}