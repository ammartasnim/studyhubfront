export interface NotificationUI {
  id: number;
  type: string;
  message: string;
  description?: string;
  link?: string;
  refId?: number;
  targetType?: 'POST' | 'COMMENT';
  isRead: boolean;
  createdAt: Date | null;
}

export interface PaginatedNotifications {
  items: NotificationUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
