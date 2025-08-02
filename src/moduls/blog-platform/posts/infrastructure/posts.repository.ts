import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GetPostsQueryDto } from '../dto/get-posts-query.dto';

import { DeletionStatus, Post } from '../domain/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from '../dto/create-post.dto';
import { Blog } from '../../blogs/domain/blog.enity';
import { Pagination } from '../dto/pagination.dto';
import { PostViewDto } from '../dto/posts-view.dto';
import { UpdatePostDto } from '../dto/update.post.dto';
import { LikeStatus } from '../likes/like.enum';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly dataSource: DataSource,
  ) {}

  async createPost(dto: CreatePostDto & { blog: Blog }): Promise<Post> {
    const post = this.postRepo.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blog: dto.blog,
    });

    return this.postRepo.save(post);
  }

  async getPostsByBlogId(
    blogId: string,
    query: GetPostsQueryDto,
    userId?: string,
  ): Promise<Pagination<PostViewDto>> {
    const {
      pageNumber = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortDirection = 'desc',
    } = query;

    const allowedSortFields = [
      'createdAt',
      'title',
      'shortDescription',
      'content',
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.blog_id = :blogId', { blogId })
      .andWhere('post.deletionStatus = :status', {
        status: DeletionStatus.ACTIVE,
      })
      .orderBy(
        `post.${safeSortBy}`,
        sortDirection.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    // Запрос для лайков текущего пользователя
    const userLikeStatuses = userId
      ? await this.getUserLikeStatuses(
          items.map((p) => p.id),
          userId,
        )
      : {};

    // Запрос для новейших лайков
    const newestLikes = await this.getNewestLikes(items.map((p) => p.id));

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: items.map((post) => ({
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blog.id,
        blogName: post.blog.name,
        createdAt: post.createdAt.toISOString(),
        extendedLikesInfo: {
          likesCount: post.likesCount || 0,
          dislikesCount: post.dislikesCount || 0,
          myStatus: userId
            ? userLikeStatuses[post.id] || LikeStatus.None
            : LikeStatus.None,
          newestLikes: newestLikes[post.id] || [],
        },
      })),
    };
  }

  private async getUserLikeStatuses(
    postIds: string[],
    userId: string,
  ): Promise<Record<string, LikeStatus>> {
    const result = await this.dataSource.query(
      `SELECT entity_id as "postId", status
       FROM likes
       WHERE entity_id = ANY($1) AND user_id = $2 AND entity_type = 'Post'`,
      [postIds, userId],
    );

    return result.reduce((acc: Record<string, LikeStatus>, curr: any) => {
      acc[curr.postId] = this.normalizeLikeStatus(curr.status);
      return acc;
    }, {});
  }

  private normalizeLikeStatus(status: string): LikeStatus {
    if (status === LikeStatus.Like) return LikeStatus.Like;
    if (status === LikeStatus.Dislike) return LikeStatus.Dislike;
    return LikeStatus.None;
  }

  private async getNewestLikes(postIds: string[]) {
    const result = await this.dataSource.query(
      `SELECT l.entity_id as "postId", l.user_id as "userId", 
              l.user_login as "login", l.created_at as "addedAt"
       FROM likes l
       WHERE l.entity_id = ANY($1) AND l.entity_type = 'Post' AND l.status = 'Like'
       ORDER BY l.created_at DESC
       LIMIT 3`,
      [postIds],
    );

    return result.reduce((acc, curr) => {
      if (!acc[curr.postId]) {
        acc[curr.postId] = [];
      }
      acc[curr.postId].push({
        addedAt: curr.addedAt.toISOString(),
        userId: curr.userId,
        login: curr.login,
      });
      return acc;
    }, {});
  }

  async getAllPostsWithPagination(
    query: GetPostsQueryDto,
    userId?: string,
  ): Promise<Pagination<PostViewDto>> {
    const {
      pageNumber = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortDirection = 'desc',
    } = query;

    const allowedSortFields = [
      'createdAt',
      'title',
      'shortDescription',
      'content',
      'blogName',
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.deletionStatus = :status', {
        status: DeletionStatus.ACTIVE,
      });

    if (safeSortBy === 'blogName') {
      qb.orderBy('blog.name', sortDirection.toUpperCase() as 'ASC' | 'DESC');
    } else {
      qb.orderBy(
        `post.${safeSortBy}`,
        sortDirection.toUpperCase() as 'ASC' | 'DESC',
      );
    }
    qb.skip((pageNumber - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    const userLikeStatuses = userId
      ? await this.getUserLikeStatuses(
          items.map((p) => p.id),
          userId,
        )
      : {};

    const newestLikes = await this.getNewestLikes(items.map((p) => p.id));

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: items.map((post) => ({
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blog.id,
        blogName: post.blog.name,
        createdAt: post.createdAt.toISOString(),
        extendedLikesInfo: {
          likesCount: post.likesCount || 0,
          dislikesCount: post.dislikesCount || 0,
          myStatus: userId
            ? userLikeStatuses[post.id] || LikeStatus.None
            : LikeStatus.None,
          newestLikes: newestLikes[post.id] || [],
        },
      })),
    };
  }

  async findPostById(
    postId: string,
    userId?: string,
  ): Promise<PostViewDto | null> {
    const post = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.id = :postId', { postId })
      .andWhere('post.deletionStatus = :status', {
        status: DeletionStatus.ACTIVE,
      })
      .getOne();

    if (!post) return null;

    let myStatus = LikeStatus.None;
    if (userId) {
      const like = await this.dataSource.query(
        `SELECT status FROM likes
         WHERE entity_id = $1 AND user_id = $2 AND entity_type = 'Post'`,
        [postId, userId],
      );
      myStatus = this.normalizeLikeStatus(like[0]?.status || LikeStatus.None);
    }

    const newestLikes = await this.dataSource.query(
      `SELECT user_id as "userId", user_login as "login", created_at as "addedAt"
       FROM likes 
       WHERE entity_id = $1 AND entity_type = 'Post' AND status = 'Like'
       ORDER BY created_at DESC
       LIMIT 3`,
      [postId],
    );

    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blog.id,
      blogName: post.blog.name,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: post.likesCount || 0,
        dislikesCount: post.dislikesCount || 0,
        myStatus,
        newestLikes: newestLikes.map((like) => ({
          addedAt: like.addedAt.toISOString(),
          userId: like.userId,
          login: like.login,
        })),
      },
    };
  }

  async updatePost(
    postId: string,
    blogId: string,
    dto: UpdatePostDto,
  ): Promise<boolean> {
    const result = await this.postRepo
      .createQueryBuilder()
      .update(Post)
      .set({
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
      })
      .where('id = :postId AND blog_id = :blogId', { postId, blogId })
      .execute();

    return result.affected > 0;
  }

  async deletePost(postId: string, blogId: string): Promise<boolean> {
    const result = await this.postRepo
      .createQueryBuilder()
      .update(Post)
      .set({ deletionStatus: DeletionStatus.DELETED })
      .where('id = :postId AND blog_id = :blogId', { postId, blogId })
      .execute();

    return result.affected > 0;
  }

  async updateLikeForPost(
    postId: string,
    userId: string,
    userLogin: string,
    status: string,
  ): Promise<void> {
    // Приводим статус к нужному формату
    const normalizedStatus = this.normalizeLikeStatus(status);

    // Получаем текущий статус лайка пользователя
    const currentLike = await this.dataSource.query(
      `SELECT status FROM likes
       WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Post'`,
      [userId, postId],
    );

    const currentStatus = currentLike[0]?.status;

    // Удаляем старый лайк, если он есть
    if (currentStatus) {
      await this.dataSource.query(
        `DELETE FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Post'`,
        [userId, postId],
      );

      // Обновляем счетчики
      await this.postRepo
        .createQueryBuilder()
        .update(Post)
        .set({
          [currentStatus === 'Like' ? 'likesCount' : 'dislikesCount']: () =>
            `${currentStatus === 'Like' ? 'likesCount' : 'dislikesCount'} - 1`,
        })
        .where('id = :postId', { postId })
        .execute();
    }

    // Если новый статус не None - добавляем новый лайк
    if (normalizedStatus !== 'None') {
      await this.dataSource.query(
        `INSERT INTO likes (user_id, user_login, entity_id, entity_type, status, created_at)
         VALUES ($1, $2, $3, 'Post', $4, NOW())`,
        [userId, userLogin, postId, normalizedStatus],
      );

      // Обновляем счетчики
      await this.postRepo
        .createQueryBuilder()
        .update(Post)
        .set({
          [normalizedStatus === 'Like' ? 'likesCount' : 'dislikesCount']: () =>
            `${normalizedStatus === 'Like' ? 'likesCount' : 'dislikesCount'} + 1`,
        })
        .where('id = :postId', { postId })
        .execute();
    }
  }
}
