import {
  TestBed, ComponentFixture, fakeAsync, tick
} from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PostCardComponent } from './posts';
import { PostFacadeService } from '../../../api/facades/post.facade';
import { CommentFacadeService } from '../../../api/facades/comment.facade';
import { FriendshipFacadeService } from '../../../api/facades/friendship.facade';
import { PostUI } from '../../../api/facades/models/post.model';
import { CommentUI, PaginatedComments } from '../../../api/facades/models/comment.model';
import { UserUI } from '../../../api/facades/models/user.model';

// ─── Test data ────────────────────────────────────────────────────────────────

const mockPost: PostUI = {
  id: 1,
  title: 'Test Post',
  content: 'This is test content',
  images: [],
  authorId: 10,
  authorUsername: 'postauthor',
  authorFirstName: 'Post',
  authorLastName: 'Author',
  authorPfp: undefined,
  communityId: 5,
  communityTitle: 'Test Community',
  authorFullName: 'Post Author',
  previewText: 'This is test content',
  imageCount: 0,
  likeCount: 3,
  commentCount: 2,
  isLiked: false,
  createdAt: new Date('2025-01-01T12:00:00Z'),
  status: 'Approved',
  isReportedByCurrentUser: false
};

const mockComment: CommentUI = {
  id: 1,
  content: 'A comment',
  postId: 1,
  userId: 5,
  authorId: 5,
  previewText: 'A comment',
  authorFullName: 'Comment Author',
  likeCount: 0,
  isLiked: false,
  isReportedByCurrentUser: false
};

const emptyPage: PaginatedComments = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 5
};

// Helper to access the component's private userContext field
function getCtx(comp: PostCardComponent): any {
  return (comp as any).userContext;
}

describe('PostCardComponent', () => {
  let fixture: ComponentFixture<PostCardComponent>;
  let component: PostCardComponent;
  let postFacadeSpy: jasmine.SpyObj<PostFacadeService>;
  let commentFacadeSpy: jasmine.SpyObj<CommentFacadeService>;

  beforeEach(async () => {
    postFacadeSpy = jasmine.createSpyObj('PostFacadeService', [
      'toggleLike', 'delete', 'approve', 'reject', 'update', 'markSeen',
      'reportPost', 'reportComment'
    ]);
    commentFacadeSpy = jasmine.createSpyObj('CommentFacadeService', [
      'getByPostPaged', 'create', 'delete', 'toggleLike', 'getReplies', 'createReply'
    ]);

    postFacadeSpy.toggleLike.and.returnValue(of(undefined as any));
    postFacadeSpy.delete.and.returnValue(of(undefined as any));
    commentFacadeSpy.getByPostPaged.and.returnValue(of(emptyPage));
    commentFacadeSpy.create.and.returnValue(of(mockComment));
    commentFacadeSpy.delete.and.returnValue(of(undefined as any));
    commentFacadeSpy.toggleLike.and.returnValue(of(undefined as any));
    commentFacadeSpy.getReplies.and.returnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      imports: [PostCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PostFacadeService, useValue: postFacadeSpy },
        { provide: CommentFacadeService, useValue: commentFacadeSpy },
        {
          provide: FriendshipFacadeService,
          useValue: { searchFriends: () => of([]), getBlockedUsers: () => of({ items: [] }) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PostCardComponent);
    fixture.componentRef.setInput('post', mockPost);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  afterEach(() => {
    getCtx(component)?.clear?.();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize localPost from the input post', () => {
    expect(component.localPost()).toEqual(jasmine.objectContaining({ id: 1, title: 'Test Post' }));
  });

  it('should start with comments collapsed', () => {
    expect(component.commentsExpanded()).toBeFalse();
  });

  it('should start with editing false', () => {
    expect(component.editing()).toBeFalse();
  });

  it('should start with empty commentInput', () => {
    expect(component.commentInput()).toBe('');
  });

  // ─── getInitials ──────────────────────────────────────────────────────────

  describe('getInitials', () => {
    it('should return initials for a full name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should return single initial for one word', () => {
      expect(component.getInitials('Alice')).toBe('A');
    });

    it('should return ? for empty string', () => {
      expect(component.getInitials('')).toBe('?');
    });

    it('should return ? for whitespace only', () => {
      expect(component.getInitials('   ')).toBe('?');
    });

    it('should return max 2 chars from initials', () => {
      expect(component.getInitials('Alice Bob Carol')).toBe('AB');
    });

    it('should uppercase initials', () => {
      expect(component.getInitials('alice bob')).toBe('AB');
    });
  });

  // ─── getTimeAgo ───────────────────────────────────────────────────────────

  describe('getTimeAgo', () => {
    it('should return empty string for null', () => {
      expect(component.getTimeAgo(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.getTimeAgo(undefined)).toBe('');
    });

    it('should return "just now" for a very recent date', () => {
      expect(component.getTimeAgo(new Date())).toBe('just now');
    });

    it('should return minutes ago format', () => {
      const past = new Date(Date.now() - 5 * 60 * 1000);
      expect(component.getTimeAgo(past)).toBe('5m ago');
    });

    it('should return hours ago format', () => {
      const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(component.getTimeAgo(past)).toBe('3h ago');
    });

    it('should return days ago format', () => {
      const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(component.getTimeAgo(past)).toBe('2d ago');
    });
  });

  // ─── uploadUrl ────────────────────────────────────────────────────────────

  describe('uploadUrl', () => {
    it('should return empty string for null', () => {
      expect(component.uploadUrl(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.uploadUrl(undefined)).toBe('');
    });

    it('should return absolute URL unchanged', () => {
      expect(component.uploadUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
    });

    it('should prepend base URL for relative paths', () => {
      expect(component.uploadUrl('img.jpg')).toContain('localhost:8081/uploads/img.jpg');
    });
  });

  // ─── isOwnPost ────────────────────────────────────────────────────────────

  describe('isOwnPost', () => {
    it('should return false when user is null', () => {
      getCtx(component)?.clear();
      expect(component.isOwnPost()).toBeFalse();
    });

    it('should return false when user id differs from post authorId', () => {
      getCtx(component)?.setUser({ id: 99, role: 'Client' } as UserUI);
      expect(component.isOwnPost()).toBeFalse();
    });

    it('should return true when user id matches post authorId (10)', () => {
      getCtx(component)?.setUser({ id: 10, role: 'Client' } as UserUI);
      expect(component.isOwnPost()).toBeTrue();
    });
  });

  // ─── isOwnComment ─────────────────────────────────────────────────────────

  describe('isOwnComment', () => {
    it('should return false when user is null', () => {
      getCtx(component)?.clear();
      expect(component.isOwnComment(5)).toBeFalse();
    });

    it('should return false when userId does not match', () => {
      getCtx(component)?.setUser({ id: 99, role: 'Client' } as UserUI);
      expect(component.isOwnComment(5)).toBeFalse();
    });

    it('should return true when userId matches current user', () => {
      getCtx(component)?.setUser({ id: 5, role: 'Client' } as UserUI);
      expect(component.isOwnComment(5)).toBeTrue();
    });

    it('should return false for undefined userId', () => {
      getCtx(component)?.setUser({ id: 5, role: 'Client' } as UserUI);
      expect(component.isOwnComment(undefined)).toBeFalse();
    });
  });

  // ─── editing ──────────────────────────────────────────────────────────────

  describe('editing', () => {
    it('should set editing to true and populate fields on startEdit', () => {
      component.startEdit();
      expect(component.editing()).toBeTrue();
      expect(component.editTitle).toBe('Test Post');
      expect(component.editContent).toBe('This is test content');
    });

    it('should populate editExistingImages with post images on startEdit', () => {
      fixture.componentRef.setInput('post', { ...mockPost, images: ['a.jpg', 'b.jpg'] });
      component.startEdit();
      expect(component.editExistingImages()).toEqual(['a.jpg', 'b.jpg']);
    });

    it('should reset all editing state on cancelEdit', () => {
      component.startEdit();
      component.cancelEdit();
      expect(component.editing()).toBeFalse();
      expect(component.editTitle).toBe('');
      expect(component.editContent).toBe('');
      expect(component.editExistingImages()).toEqual([]);
    });
  });

  // ─── toggleLike ───────────────────────────────────────────────────────────

  describe('toggleLike', () => {
    it('should call postFacade.toggleLike with the post id', fakeAsync(async () => {
      await component.toggleLike();
      tick();
      expect(postFacadeSpy.toggleLike).toHaveBeenCalledWith(1);
    }));

    it('should toggle isLiked on localPost', fakeAsync(async () => {
      const was = component.localPost().isLiked;
      await component.toggleLike();
      tick();
      expect(component.localPost().isLiked).toBe(!was);
    }));

    it('should increment likeCount when post was not liked', fakeAsync(async () => {
      const initial = component.localPost().likeCount;
      await component.toggleLike();
      tick();
      expect(component.localPost().likeCount).toBe(initial + 1);
    }));
  });

  // ─── toggleComments ───────────────────────────────────────────────────────

  describe('toggleComments', () => {
    it('should expand comments and load first page', fakeAsync(async () => {
      component.toggleComments();
      tick();
      expect(component.commentsExpanded()).toBeTrue();
      expect(commentFacadeSpy.getByPostPaged).toHaveBeenCalledWith(1, 0, 5);
    }));

    it('should collapse comments on second call', fakeAsync(async () => {
      component.toggleComments();
      tick();
      component.toggleComments();
      expect(component.commentsExpanded()).toBeFalse();
    }));
  });

  // ─── submitComment ────────────────────────────────────────────────────────

  describe('submitComment', () => {
    it('should not call create when input is empty', fakeAsync(async () => {
      component.commentInput.set('');
      await component.submitComment();
      tick();
      expect(commentFacadeSpy.create).not.toHaveBeenCalled();
    }));

    it('should call commentFacade.create with content and post id', fakeAsync(async () => {
      component.commentInput.set('My comment');
      await component.submitComment();
      tick();
      expect(commentFacadeSpy.create).toHaveBeenCalledWith({ content: 'My comment', postId: 1 });
    }));

    it('should clear commentInput after submitting', fakeAsync(async () => {
      component.commentInput.set('My comment');
      await component.submitComment();
      tick();
      expect(component.commentInput()).toBe('');
    }));

    it('should increment commentCount on localPost after submit', fakeAsync(async () => {
      const initial = component.localPost().commentCount;
      component.commentInput.set('My comment');
      await component.submitComment();
      tick();
      expect(component.localPost().commentCount).toBe(initial + 1);
    }));
  });
});
