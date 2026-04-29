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
  communityTitle: string;
  // UI helper fields
  authorFullName: string;
  previewText: string;
  imageCount: number;
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
