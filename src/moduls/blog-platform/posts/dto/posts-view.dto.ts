import { ExtendedLikesInfo } from './like-types';

export class NewestLikeDto {
  addedAt: string;
  userId: string;
  login: string;
}

export type LikeStatus = 'None' | 'Like' | 'Dislike';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfo;
}
