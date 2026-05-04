export interface ModeratorInfo {
  userId?: number;
  username?: string;
  fullName?: string;
  permissions?: string[];
}

export interface CommunityResDto {
  id?: number;
  title?: string;
  description?: string;
  nbrMembers?: number;
  ownerId?: number;
  category?: string;
  moderators?: ModeratorInfo[];
}
