export interface CommentUI {
  id: number;
  content: string;
  postId: number;
  userId: number;
  previewText: string;
  authorUsername?: string;
  authorFullName?: string;
  authorPfp?: string;
  createdAt?: Date;
   likeCount: number;
  isLiked: boolean;
}

export interface PaginatedComments {
  items: CommentUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
