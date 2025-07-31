import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { PostsRepository } from '../infrastructure/posts.repository';
import { CreatePostDto } from '../dto/create-post.dto';
import { GetPostsQueryDto } from '../dto/get-posts-query.dto';
import { PostViewDto } from '../dto/posts-view.dto';
import { Pagination } from '../dto/pagination.dto';
import { UpdatePostDto } from '../dto/update.post.dto';
import { LikeStatusEnum } from '../dto/like-status.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly blogsRepo: BlogsRepository,
    private readonly postsRepo: PostsRepository,
  ) {}

  async createPostForBlog(
    blogId: string,
    dto: CreatePostDto,
  ): Promise<PostViewDto> {
    const blog = await this.blogsRepo.findBlogById(blogId);
    if (!blog) throw new NotFoundException();

    const post = await this.postsRepo.createPost({
      ...dto,
      blog,
    });

    return this.postsRepo.findPostById(post.id);
  }

  async getPostsByBlog(
    blogId: string,
    query: GetPostsQueryDto,
    userId?: string,
  ): Promise<Pagination<PostViewDto>> {
    const blog = await this.blogsRepo.findBlogById(blogId);
    if (!blog) throw new NotFoundException();

    return this.postsRepo.getPostsByBlogId(blogId, query, userId);
  }

  async getAllPosts(
    query: GetPostsQueryDto,
    userId?: string,
  ): Promise<Pagination<PostViewDto>> {
    return this.postsRepo.getAllPostsWithPagination(query, userId);
  }

  async getPostById(id: string, userId?: string): Promise<PostViewDto | null> {
    return this.postsRepo.findPostById(id, userId);
  }

  async updatePost(
    postId: string,
    blogId: string,
    dto: UpdatePostDto,
  ): Promise<boolean> {
    return await this.postsRepo.updatePost(postId, blogId, dto);
  }

  async deletePost(postId: string, blogId: string): Promise<void> {
    const isDeleted = await this.postsRepo.deletePost(postId, blogId);
    if (!isDeleted) {
      throw new NotFoundException();
    }
  }

  async likePost(
    postId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatusEnum,
  ): Promise<void> {
    const post = await this.postsRepo.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    await this.postsRepo.updateLikeForPost(
      postId,
      userId,
      userLogin,
      likeStatus,
    );
  }
}
