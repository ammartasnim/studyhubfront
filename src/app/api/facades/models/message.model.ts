export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface MessageSendRequest {
  recipientId: number;
  content: string;
}

export interface MessageReadRequest {
  conversationId: number;
}

export interface MessageHistoryRequest {
  conversationId: number;
  page?: number;
  size?: number;
}

export interface MessageUI {
  id: number;
  conversationId: number;
  senderId: number;
  senderUsername?: string;
  recipientId: number;
  recipientUsername?: string;
  content: string;
  status?: MessageStatus;
  createdAt: Date | null;
}

export interface ConversationUI {
  id: number;
  userOneId: number;
  userTwoId: number;
  updatedAt: Date | null;
  lastMessage?: MessageUI;
}

export interface PaginatedMessages {
  items: MessageUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
