/**
 * Comment UI Model - Clean interface for components
 */
export interface CommentUI {
  id: number;
  content: string;
  postId: number;
  userId: number;
  previewText: string;
}
