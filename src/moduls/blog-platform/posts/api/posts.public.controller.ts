import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { GetPostsQueryDto } from '../dto/get-posts-query.dto';
import { PostViewDto } from '../dto/posts-view.dto';
import {
  CommentOutputType,
  CreateCommentDto,
} from '../../comments/dto/create-comment-dto';
import { CommentService } from '../../comments/application/comment-service';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { CurrentUser } from '../../../user-accounts/decarators/current-user';
import { GetCommentsQueryDto } from '../../comments/dto/getCommentsDto';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-guard';
import { LikeStatusDto } from '../dto/like-status.dto';

@Controller('posts')
export class PostsPublicController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentService,
  ) {}

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPosts(
    @Query() query: GetPostsQueryDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.postsService.getAllPosts(query, userId);
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getPostById(
    @Param('id') id: string,
    @CurrentUser('userId') userId?: string,
  ): Promise<PostViewDto> {
    const post = await this.postsService.getPostById(id, userId);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('login') userLogin: string,
  ): Promise<CommentOutputType> {
    return this.commentsService.createComment(postId, userId, userLogin, dto);
  }
  @Get(':postId/comments')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryDto,
    @CurrentUser('userId') userId: string,
  ) {
    console.log('🟡 userId:', userId);
    return this.commentsService.getCommentsForPost(postId, query, userId);
  }

  @Put(':postId/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async likePost(
    @Param('postId') postId: string,
    @Body() dto: LikeStatusDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('login') userLogin: string,
  ) {
    await this.postsService.likePost(postId, userId, userLogin, dto.likeStatus);
  }
}
