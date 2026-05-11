import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CommentFacadeService } from './comment.facade';
import { CommentControllerService } from '../api/commentController.service';
import { CommentResDto } from '../model/commentResDto';
import { PageCommentResDto } from '../model/pageCommentResDto';

const mockCommentDto: CommentResDto = {
  id: 1,
  content: 'Test comment content',
  postId: 10,
  userId: 5,
  authorUsername: 'testuser',
  authorFirstName: 'John',
  authorLastName: 'Doe',
  authorPfp: undefined,
  createdAt: '2025-01-01T00:00:00Z',
  likeCount: 3,
  isLiked: false,
  isReportedByCurrentUser: false
};

const mockPageResponse: PageCommentResDto = {
  content: [mockCommentDto],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 10
};

describe('CommentFacadeService', () => {
  let service: CommentFacadeService;
  let controller: jasmine.SpyObj<CommentControllerService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CommentControllerService', [
      'createCommentForPost', 'getCommentsByPostPaged', 'getAllComments',
      'getMyComments', 'getCommentStats', 'editComment', 'deleteComment',
      'toggleLike', 'getReplies', 'replyToComment'
    ]);

    TestBed.configureTestingModule({
      providers: [
        CommentFacadeService,
        { provide: CommentControllerService, useValue: spy }
      ]
    });

    service = TestBed.inject(CommentFacadeService);
    controller = TestBed.inject(CommentControllerService) as jasmine.SpyObj<CommentControllerService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should error when content is empty', (done) => {
      service.create({ content: '', postId: 1 }).subscribe({
        error: (err) => { expect(err.message).toBe('Comment content is required'); done(); }
      });
    });

    it('should error when content is whitespace', (done) => {
      service.create({ content: '   ', postId: 1 }).subscribe({
        error: (err) => { expect(err.message).toBe('Comment content is required'); done(); }
      });
    });

    it('should error when postId is zero', (done) => {
      service.create({ content: 'hello', postId: 0 }).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid post ID'); done(); }
      });
    });

    it('should error when postId is negative', (done) => {
      service.create({ content: 'hello', postId: -5 }).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid post ID'); done(); }
      });
    });

    it('should call controller and return mapped comment', (done) => {
      controller.createCommentForPost.and.returnValue(of(mockCommentDto));
      service.create({ content: '  Hello world  ', postId: 10 }).subscribe({
        next: (comment) => {
          expect(comment.id).toBe(1);
          expect(comment.content).toBe('Test comment content');
          expect(comment.authorFullName).toBe('John Doe');
          expect(controller.createCommentForPost).toHaveBeenCalledWith(10, {
            content: 'Hello world',
            postId: 10
          });
          done();
        }
      });
    });
  });

  // ─── getByPostPaged ───────────────────────────────────────────────────────

  describe('getByPostPaged', () => {
    it('should error when postId is zero', (done) => {
      service.getByPostPaged(0, 0, 10).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid post ID'); done(); }
      });
    });

    it('should call controller and map paged response', (done) => {
      controller.getCommentsByPostPaged.and.returnValue(of(mockPageResponse));
      service.getByPostPaged(10, 0, 10).subscribe({
        next: (result) => {
          expect(result.items.length).toBe(1);
          expect(result.totalItems).toBe(1);
          expect(result.totalPages).toBe(1);
          expect(result.currentPage).toBe(0);
          done();
        }
      });
    });

    it('should return empty result for null response', (done) => {
      controller.getCommentsByPostPaged.and.returnValue(of(null as any));
      service.getByPostPaged(10, 0, 10).subscribe({
        next: (result) => {
          expect(result.items).toEqual([]);
          expect(result.totalItems).toBe(0);
          done();
        }
      });
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should error when commentId is zero', (done) => {
      service.delete(0).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid comment ID'); done(); }
      });
    });

    it('should error when commentId is negative', (done) => {
      service.delete(-1).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid comment ID'); done(); }
      });
    });

    it('should call controller.deleteComment with correct id', (done) => {
      controller.deleteComment.and.returnValue(of(undefined) as any);
      service.delete(5).subscribe({
        next: () => {
          expect(controller.deleteComment).toHaveBeenCalledWith(5);
          done();
        }
      });
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should error when commentId is invalid', (done) => {
      service.update(0, { content: 'test', postId: 1 }).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid comment ID'); done(); }
      });
    });

    it('should error when content is empty', (done) => {
      service.update(1, { content: '', postId: 1 }).subscribe({
        error: (err) => { expect(err.message).toBe('Comment content is required'); done(); }
      });
    });

    it('should call editComment on valid input', (done) => {
      controller.editComment.and.returnValue(of(mockCommentDto) as any);
      service.update(1, { content: 'Updated', postId: 10 }).subscribe({
        next: (comment) => {
          expect(comment.id).toBe(1);
          expect(controller.editComment).toHaveBeenCalledWith(1, { content: 'Updated', postId: 10 });
          done();
        }
      });
    });
  });

  // ─── toggleLike ───────────────────────────────────────────────────────────

  describe('toggleLike', () => {
    it('should error when commentId is zero', (done) => {
      service.toggleLike(0).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid comment ID'); done(); }
      });
    });

    it('should call controller.toggleLike', (done) => {
      controller.toggleLike.and.returnValue(of(undefined));
      service.toggleLike(3).subscribe({
        next: () => {
          expect(controller.toggleLike).toHaveBeenCalledWith(3);
          done();
        }
      });
    });
  });

  // ─── createReply ──────────────────────────────────────────────────────────

  describe('createReply', () => {
    it('should error when commentId is invalid', (done) => {
      service.createReply(-1, { content: 'reply' }).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid comment ID'); done(); }
      });
    });

    it('should error when content is empty', (done) => {
      service.createReply(1, { content: '' }).subscribe({
        error: (err) => { expect(err.message).toBe('Reply content is required'); done(); }
      });
    });

    it('should call replyToComment with trimmed content', (done) => {
      controller.replyToComment.and.returnValue(of(mockCommentDto));
      service.createReply(1, { content: '  hello  ' }).subscribe({
        next: (reply) => {
          expect(reply.id).toBe(1);
          expect(controller.replyToComment).toHaveBeenCalledWith(1, { content: 'hello', postId: 0 });
          done();
        }
      });
    });
  });

  // ─── getReplies ───────────────────────────────────────────────────────────

  describe('getReplies', () => {
    it('should error when commentId is invalid', (done) => {
      service.getReplies(0).subscribe({
        error: (err) => { expect(err.message).toBe('Invalid comment ID'); done(); }
      });
    });

    it('should call controller.getReplies', (done) => {
      controller.getReplies.and.returnValue(of(mockPageResponse));
      service.getReplies(1, 0, 5).subscribe({
        next: (result) => {
          expect(result.items.length).toBe(1);
          expect(controller.getReplies).toHaveBeenCalledWith(1, 0, 5);
          done();
        }
      });
    });
  });

  // ─── mapToUI ──────────────────────────────────────────────────────────────

  describe('mapToUI', () => {
    it('should throw when dto is null', () => {
      expect(() => service.mapToUI(null as any)).toThrowError('Comment data is null or undefined');
    });

    it('should throw when dto is undefined', () => {
      expect(() => service.mapToUI(undefined as any)).toThrowError('Comment data is null or undefined');
    });

    it('should build full name from first and last name', () => {
      const ui = service.mapToUI(mockCommentDto);
      expect(ui.authorFullName).toBe('John Doe');
    });

    it('should fallback to authorUsername when no name', () => {
      const dto: CommentResDto = { ...mockCommentDto, authorFirstName: undefined, authorLastName: undefined };
      const ui = service.mapToUI(dto);
      expect(ui.authorFullName).toBe('testuser');
    });

    it('should fallback to User #id when no name or username', () => {
      const dto: CommentResDto = {
        ...mockCommentDto,
        authorFirstName: undefined,
        authorLastName: undefined,
        authorUsername: undefined,
        userId: 42
      };
      const ui = service.mapToUI(dto);
      expect(ui.authorFullName).toBe('User #42');
    });

    it('should truncate previewText for content over 50 chars', () => {
      const longContent = 'a'.repeat(60);
      const ui = service.mapToUI({ ...mockCommentDto, content: longContent });
      expect(ui.previewText).toBe('a'.repeat(50) + '...');
    });

    it('should not truncate previewText for content of 50 chars or less', () => {
      const shortContent = 'a'.repeat(50);
      const ui = service.mapToUI({ ...mockCommentDto, content: shortContent });
      expect(ui.previewText).toBe(shortContent);
    });

    it('should set default values for missing fields', () => {
      const minimal: CommentResDto = {};
      const ui = service.mapToUI(minimal);
      expect(ui.id).toBe(0);
      expect(ui.likeCount).toBe(0);
      expect(ui.isLiked).toBeFalse();
      expect(ui.isReportedByCurrentUser).toBeFalse();
    });

    it('should parse createdAt string to Date', () => {
      const ui = service.mapToUI(mockCommentDto);
      expect(ui.createdAt).toBeInstanceOf(Date);
    });
  });
});
