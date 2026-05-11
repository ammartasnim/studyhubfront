

export interface PostResDto { 
    id?: number;
    title?: string;
    content?: string;
    imgs?: Array<string>;
    userId?: number;
    userUsername?: string;
    userFirstName?: string;
    userLastName?: string;
    userPfp?: string;
    communityId?: number;
    communityTitle?: string;
    status?: PostResDto.StatusEnum;
    likeCount?: number;
    commentCount?: number;
    createdAt?: string;
    liked?: boolean;
    isReportedByCurrentUser?: boolean;
}
export namespace PostResDto {
    export const StatusEnum = {
        Pending: 'Pending',
        Approved: 'Approved',
        Flagged: 'Flagged'
    } as const;
    export type StatusEnum = typeof StatusEnum[keyof typeof StatusEnum];
}


