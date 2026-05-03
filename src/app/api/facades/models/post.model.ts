/**
 * Post UI Model - Clean interface for components
 */
export interface PostUI {
  id: number;
  title: string;
  content: string;
  images: string[];
  authorUsername: string;
  authorFirstName: string;
  authorLastName: string;
  authorPfp?: string;
  communityTitle: string;
  // UI helper fields
  authorFullName: string;
  previewText: string;
  imageCount: number;
  // Engagement fields
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: Date | null;
  status: string;
}

/**
 * Paginated Posts Response
 */
export interface PaginatedPosts {
  items: PostUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
