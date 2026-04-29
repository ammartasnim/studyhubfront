/**
 * User UI Model - Clean interface for components
 */
export interface UserUI {
  id: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  pfp?: string;
  phone?: string;
  xpPts?: number;
  level?: number;
  banned?: boolean;
  role?: 'Admin' | 'Client';
  badges?: Badge[];
}

export interface Badge {
  id?: number;
  type?: string;
  userId?: number;
}

/**
 * Paginated Users Response
 */
export interface PaginatedUsers {
  items: UserUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
