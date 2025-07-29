import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { GetBlogsQueryDto } from '../dto/getBlogsQueryDto';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { BlogsViewDto } from '../dto/blog-view.dto';
import { GetPostsQueryDto } from '../../posts/dto/get-posts-query.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { CurrentUser } from '../../../user-accounts/decarators/current-user';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-guard';

@Controller('blogs')
export class PublicBlogsController {
  constructor(
    private blogRepo: BlogsRepository,
    private readonly blogsQueryRepo: BlogsQueryRepository,
    private readonly postsRepo: PostsRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllBlogs(@Query() query: GetBlogsQueryDto) {
    return this.blogRepo.getAllBlogsWithPagination(query);
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogsViewDto> {
    return this.blogsQueryRepo.getByIdOrNotFoundFail(id);
  }
  @Get(':id/posts')
  @UseGuards(JwtOptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPostsForBlog(
    @Param('id') blogId: string,
    @Query() query: GetPostsQueryDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.postsRepo.getPostsByBlogId(blogId, query, userId);
  }
}
