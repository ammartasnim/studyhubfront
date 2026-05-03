export interface CommentResDto {
    id?: number;
    postId?: number;
    userId?: number;
    content?: string;
    authorFirstName?: string;
    authorLastName?: string;
    authorUsername?: string;
    authorPfp?: string;
    createdAt?: string;
    likeCount?: number;
    isLiked?: boolean;
}
