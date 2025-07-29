import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(20, 300)
  content: string;
}
export class CommentatorInfo {
  userId: string;
  userLogin: string;
}

export class LikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: 'None' | 'Like' | 'Dislike';
}

export class CommentOutputType {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string; // ISO string
  likesInfo: LikesInfo;
}

export class UpdateCommentDto {
  @IsString()
  @Length(20, 300)
  content: string;
}
