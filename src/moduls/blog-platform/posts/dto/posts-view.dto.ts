import { LikeStatus } from '../likes/like.enum';

export class NewestLikeDto {
  addedAt: string;
  userId: string;
  login: string;
}

export class ExtendedLikesInfoDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: NewestLikeDto[];
}

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoDto;
}
