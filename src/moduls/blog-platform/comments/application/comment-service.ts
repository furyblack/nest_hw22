import { CommentRepository } from '../infrastructure/comment-repository';
import { CommentOutputType, CreateCommentDto } from '../dto/create-comment-dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from '../../posts/application/posts.service';
import { GetCommentsQueryDto } from '../dto/getCommentsDto';
import { Pagination } from '../../posts/dto/pagination.dto';
import { LikeStatusEnum } from '../../posts/dto/like-status.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentsRepository: CommentRepository,
    private readonly postsService: PostsService,
  ) {}

  async createComment(
    postId: string,
    userId: string,
    userLogin: string,
    dto: CreateCommentDto,
  ): Promise<CommentOutputType> {
    try {
      const post = await this.postsService.getPostById(postId);
      if (!post) throw new NotFoundException('Post not found');

      const comment = await this.commentsRepository.create({
        content: dto.content,
        postId,
        userId,
        userLogin,
      });

      return {
        id: comment.id,
        content: comment.content,
        commentatorInfo: {
          userId,
          userLogin,
        },
        createdAt: comment.created_at.toISOString(),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
        },
      };
    } catch (err) {
      console.error('🔥 Ошибка при создании комментария:', err);
      throw err;
    }
  }

  async getCommentById(
    commentId: string,
    currentUserId?: string,
  ): Promise<CommentOutputType> {
    const comment = await this.commentsRepository.findById(
      commentId,
      currentUserId,
    );
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async updateComment(
    commentId: string,
    content: string,
    userId: string,
  ): Promise<void> {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenException('You are not the owner of this comment');
    }

    await this.commentsRepository.updateContent(commentId, content);
  }

  async getCommentsForPost(
    postId: string,
    query: GetCommentsQueryDto,
    currentUserId: string,
  ): Promise<Pagination<CommentOutputType>> {
    const post = await this.postsService.getPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    return this.commentsRepository.getCommentsForPost(
      postId,
      query,
      currentUserId,
    );
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenException('You are not the owner of this comment');
    }

    await this.commentsRepository.delete(commentId);
  }

  async likeComment(
    commentId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatusEnum,
  ): Promise<void> {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.commentsRepository.updateLikeForComment(
      commentId,
      userId,
      userLogin,
      likeStatus,
    );
  }
}
