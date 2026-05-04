/**
 * Friendship UI Models
 */
export interface UserSummaryUI {
  id: number;
  username?: string;
  pfp?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface FriendshipUI {
  requesterId: number;
  addresseeId: number;
  status?: FriendshipStatus;
  createdAt?: Date | null;
  requester?: UserSummaryUI;
  addressee?: UserSummaryUI;
}

export interface PaginatedUserSummaries {
  items: UserSummaryUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PaginatedFriendships {
  items: FriendshipUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
