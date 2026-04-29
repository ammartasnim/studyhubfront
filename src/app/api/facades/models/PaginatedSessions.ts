import { FocusSessionResDto } from "../../model/focusSessionResDto";

export interface PaginatedSessions {
  items: FocusSessionResDto[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}