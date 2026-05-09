import { FocusSessionUI } from './focus-session.model';

export interface PaginatedSessions {
  items: FocusSessionUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}