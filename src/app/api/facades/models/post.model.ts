export interface PostUI {
  id: number;
  title: string;
  content: string;
  images: string[];
  authorId?: number;
  authorUsername: string;
  authorFirstName: string;
  authorLastName: string;
  authorPfp?: string;
  communityId?: number;
  communityTitle: string;
  authorFullName: string;
  previewText: string;
  imageCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: Date | null;
  status: string;
  isReportedByCurrentUser: boolean;
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