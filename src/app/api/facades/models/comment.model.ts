export interface CommentUI {
  id: number;
  content: string;
  postId: number;
  userId: number;
  authorId: number;
  previewText: string;
  authorUsername?: string;
  authorFullName?: string;
  authorPfp?: string;
  createdAt?: Date;
  likeCount: number;
  isLiked: boolean;
  isReportedByCurrentUser: boolean;
}

export interface PaginatedComments {
  items: CommentUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}