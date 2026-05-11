import {
  TestBed, ComponentFixture
} from '@angular/core/testing';
import {
  Component, Input, Output, EventEmitter,
  provideZonelessChangeDetection, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { FeedComponent } from './feed';
import { FeedService } from '../../../services/feed.service';
import { PostUI } from '../../../api/facades/models/post.model';
import { PostFacadeService } from '../../../api/facades/post.facade';
import { CommentFacadeService } from '../../../api/facades/comment.facade';
import { FriendshipFacadeService } from '../../../api/facades/friendship.facade';
import { CommunityFacadeService } from '../../../api/facades/community.facade';

// ─── Stub child components ────────────────────────────────────────────────────

@Component({ selector: 'app-create-post-modal', standalone: true, template: '' })
class StubCreatePostModalComponent {
  open() {}
  @Output() postCreated = new EventEmitter<void>();
}

@Component({ selector: 'app-create-community-modal', standalone: true, template: '' })
class StubCreateCommunityModalComponent {
  open() {}
  @Output() communityCreated = new EventEmitter<void>();
}

@Component({ selector: 'app-post-card', standalone: true, template: '' })
class StubPostCardComponent {
  @Input() post: any = null;
  @Input() showLike = true;
  @Input() showComments = true;
  @Input() showReport = true;
  @Input() showCommunity = true;
  @Output() postDeleted = new EventEmitter<number>();
}

// ─── Mock post factory ────────────────────────────────────────────────────────

function makePost(overrides: Partial<PostUI> = {}): PostUI {
  return {
    id: 1,
    title: 'Default Title',
    content: 'Default content',
    images: [],
    authorId: 1,
    authorUsername: 'user',
    authorFirstName: 'First',
    authorLastName: 'Last',
    communityId: 1,
    communityTitle: 'General',
    authorFullName: 'First Last',
    previewText: 'Default content',
    imageCount: 0,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    createdAt: null,
    status: 'Approved',
    isReportedByCurrentUser: false,
    ...overrides
  };
}

describe('FeedComponent', () => {
  let fixture: ComponentFixture<FeedComponent>;
  let component: FeedComponent;

  const postsSignal = signal<PostUI[]>([]);

  const mockFeedService = {
    posts: postsSignal,
    isLoading: signal(false),
    isLoadingMore: signal(false),
    error: signal<string | null>(null),
    hasMore: signal(true),
    hasCommunities: signal(false),
    init: jasmine.createSpy('init').and.returnValue(Promise.resolve()),
    loadFeed: jasmine.createSpy('loadFeed').and.returnValue(Promise.resolve()),
    loadMorePosts: jasmine.createSpy('loadMorePosts').and.returnValue(Promise.resolve()),
    checkCommunities: jasmine.createSpy('checkCommunities').and.returnValue(Promise.resolve()),
  };

  beforeEach(async () => {
    mockFeedService.init.calls.reset();
    mockFeedService.loadFeed.calls.reset();
    mockFeedService.checkCommunities.calls.reset();
    postsSignal.set([]);

    TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FeedService, useValue: mockFeedService },
        {
          provide: PostFacadeService,
          useValue: jasmine.createSpyObj('PostFacadeService', ['toggleLike', 'delete', 'getFeed', 'markSeen', 'reportPost', 'reportComment'])
        },
        {
          provide: CommentFacadeService,
          useValue: jasmine.createSpyObj('CommentFacadeService', ['create', 'delete', 'getByPostPaged', 'toggleLike', 'getReplies', 'createReply'])
        },
        {
          provide: FriendshipFacadeService,
          useValue: { searchFriends: () => of([]), getBlockedUsers: () => of({ items: [] }) }
        },
        {
          provide: CommunityFacadeService,
          useValue: jasmine.createSpyObj('CommunityFacadeService', ['getMy', 'getAll'])
        }
      ]
    });

    TestBed.overrideComponent(FeedComponent, {
      set: {
        imports: [
          CommonModule,
          StubCreatePostModalComponent,
          StubCreateCommunityModalComponent,
          StubPostCardComponent
        ]
      }
    });

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(FeedComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  afterEach(() => {
    postsSignal.set([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call feedService.init on ngOnInit', () => {
    expect(mockFeedService.init).toHaveBeenCalledTimes(1);
  });

  it('should start with empty searchQuery', () => {
    expect(component.searchQuery()).toBe('');
  });

  // ─── filteredPosts ────────────────────────────────────────────────────────

  describe('filteredPosts', () => {
    it('should return all posts when search query is empty', () => {
      postsSignal.set([makePost({ id: 1 }), makePost({ id: 2 })]);
      expect(component.filteredPosts().length).toBe(2);
    });

    it('should filter by title (case-insensitive)', () => {
      postsSignal.set([
        makePost({ id: 1, title: 'Angular Testing' }),
        makePost({ id: 2, title: 'React Hooks' })
      ]);
      component.searchQuery.set('angular');
      expect(component.filteredPosts().length).toBe(1);
      expect(component.filteredPosts()[0].id).toBe(1);
    });

    it('should filter by content', () => {
      postsSignal.set([
        makePost({ id: 1, content: 'How to use signals' }),
        makePost({ id: 2, content: 'CSS grid layout' })
      ]);
      component.searchQuery.set('signals');
      expect(component.filteredPosts().length).toBe(1);
    });

    it('should filter by authorFullName', () => {
      postsSignal.set([
        makePost({ id: 1, authorFullName: 'Alice Smith' }),
        makePost({ id: 2, authorFullName: 'Bob Jones' })
      ]);
      component.searchQuery.set('alice');
      expect(component.filteredPosts().length).toBe(1);
      expect(component.filteredPosts()[0].id).toBe(1);
    });

    it('should filter by communityTitle', () => {
      postsSignal.set([
        makePost({ id: 1, communityTitle: 'Machine Learning' }),
        makePost({ id: 2, communityTitle: 'Web Dev' })
      ]);
      component.searchQuery.set('machine');
      expect(component.filteredPosts().length).toBe(1);
    });

    it('should return empty array when no posts match', () => {
      postsSignal.set([makePost({ id: 1, title: 'Hello World' })]);
      component.searchQuery.set('xyz_no_match');
      expect(component.filteredPosts().length).toBe(0);
    });

    it('should trim whitespace from search query', () => {
      postsSignal.set([makePost({ id: 1, title: 'Angular' })]);
      component.searchQuery.set('   angular   ');
      expect(component.filteredPosts().length).toBe(1);
    });
  });

  // ─── onPostDeleted ────────────────────────────────────────────────────────

  describe('onPostDeleted', () => {
    it('should remove the deleted post from feedService.posts', () => {
      postsSignal.set([makePost({ id: 1 }), makePost({ id: 2 }), makePost({ id: 3 })]);
      component.onPostDeleted(2);
      expect(postsSignal().length).toBe(2);
      expect(postsSignal().find(p => p.id === 2)).toBeUndefined();
    });

    it('should keep other posts intact after delete', () => {
      postsSignal.set([makePost({ id: 1 }), makePost({ id: 5 })]);
      component.onPostDeleted(1);
      expect(postsSignal()[0].id).toBe(5);
    });

    it('should be a no-op when id is not found', () => {
      postsSignal.set([makePost({ id: 1 })]);
      component.onPostDeleted(999);
      expect(postsSignal().length).toBe(1);
    });
  });

  // ─── event handlers ───────────────────────────────────────────────────────

  describe('onPostCreated', () => {
    it('should call feedService.loadFeed', () => {
      component.onPostCreated();
      expect(mockFeedService.loadFeed).toHaveBeenCalled();
    });
  });

  describe('onCommunityCreated', () => {
    it('should call feedService.checkCommunities', () => {
      component.onCommunityCreated();
      expect(mockFeedService.checkCommunities).toHaveBeenCalled();
    });
  });

  // ─── scroll listener cleanup ──────────────────────────────────────────────

  it('should remove scroll listener on destroy', () => {
    const removeSpy = spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(removeSpy).toHaveBeenCalledWith('scroll', jasmine.any(Function));
  });
});
