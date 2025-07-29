import { IsEnum } from 'class-validator';

export enum LikeStatusEnum {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}
export type LikeStatusType = 'Like' | 'Dislike' | 'None';

export class LikeStatusDto {
  @IsEnum(LikeStatusEnum)
  likeStatus: LikeStatusEnum;
}
