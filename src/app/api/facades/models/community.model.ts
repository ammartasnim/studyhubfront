/**
 * Community UI Model - Clean interface for components
 * Represents a Community in the UI with properly typed fields
 */
export interface CommunityUI {
   id: number;
  title: string;
  description: string;
  nbrMembers: number;
  ownerId?: number;
  category?: string;
  moderators?: ModeratorInfo[];
}
export interface ModeratorInfo {
  userId?: number;
  username?: string;
  fullName?: string;
  permissions?: string[];
}

/**
 * Paginated Community Response
 */
export interface PaginatedCommunities {
  items: CommunityUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
