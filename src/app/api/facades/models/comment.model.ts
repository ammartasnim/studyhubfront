/**
 * Comment UI Model - Clean interface for components
 */
export interface CommentUI {
  id: number;
  content: string;
  postId: number;
  userId: number;
  previewText: string;
  authorUsername?: string;
  authorFullName?: string;
}

export interface PaginatedComments {
  items: CommentUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
