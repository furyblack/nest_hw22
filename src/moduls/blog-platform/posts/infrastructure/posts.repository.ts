import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetPostsQueryDto } from '../dto/get-posts-query.dto';
import { LikeStatus } from '../likes/like.enum';
import { UpdatePostDto } from '../dto/update.post.dto';
import { LikeStatusEnum } from '../dto/like-status.dto';

@Injectable()
export class PostsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(post: {
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
  }) {
    const { title, shortDescription, content, blogId, blogName } = post;

    const sql = `
      INSERT INTO posts (title, short_description, content, blog_id, blog_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [title, shortDescription, content, blogId, blogName];

    const result = await this.dataSource.query(sql, values);
    return result[0];
  }

  async getPostsByBlogId(
    blogId: string,
    query: GetPostsQueryDto,
    userId?: string,
  ) {
    const page = query.pageNumber || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'created_at';
    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1. Получаем посты
    const sql = `
    SELECT * FROM posts
    WHERE blog_id = $1 AND deletion_status = 'active'
    ORDER BY ${sortBy} ${sortDirection}
    LIMIT $2 OFFSET $3
  `;
    const posts = await this.dataSource.query(sql, [blogId, pageSize, skip]);

    // 2. Получаем общее количество
    const countSql = `
    SELECT COUNT(*) FROM posts
    WHERE blog_id = $1 AND deletion_status = 'active'
  `;
    const countResult = await this.dataSource.query(countSql, [blogId]);
    const totalCount = parseInt(countResult[0].count, 10);
    const pagesCount = Math.ceil(totalCount / pageSize);

    // 3. Получаем лайки для этих постов
    const postIds = posts.map((p: any) => p.id);

    const rawLikes = await this.dataSource.query(
      `
    SELECT pl.entity_id,
           pl.user_id,
           pl.user_login,
           pl.status,
           pl.created_at
    FROM likes pl
    WHERE pl.entity_id = ANY($1) AND pl.entity_type = 'Post'
    ORDER BY pl.created_at DESC
    `,
      [postIds],
    );

    // 4. Группируем лайки
    const likesMap = new Map<
      string,
      {
        likes: any[];
        dislikes: any[];
        newestLikes: any[];
      }
    >();

    for (const postId of postIds) {
      likesMap.set(postId, {
        likes: [],
        dislikes: [],
        newestLikes: [],
      });
    }

    const userLikesMap = new Map<string, string>();
    if (userId) {
      const userLikes = await this.dataSource.query(
        `
    SELECT entity_id, status
    FROM likes
    WHERE user_id = $1 AND entity_type = 'Post' AND entity_id = ANY($2)
  `,
        [userId, postIds],
      );

      userLikes.forEach((like) => {
        userLikesMap.set(like.entity_id, like.status);
      });
    }

    for (const like of rawLikes) {
      const group = likesMap.get(like.entity_id);
      if (!group) continue;

      if (like.status === 'Like') {
        group.likes.push(like);
        if (group.newestLikes.length < 3) {
          group.newestLikes.push({
            addedAt: new Date(like.created_at).toISOString(),
            userId: like.user_id,
            login: like.user_login,
          });
        }
      } else if (like.status === 'Dislike') {
        group.dislikes.push(like);
      }
    }

    // 5. Формируем финальный массив
    const items = posts.map((p: any) => {
      const likesData = likesMap.get(p.id)!;

      const myStatus = userLikesMap.get(p.id) || 'None';

      return {
        id: p.id,
        title: p.title,
        shortDescription: p.short_description,
        content: p.content,
        blogId: p.blog_id,
        blogName: p.blog_name,
        createdAt: p.created_at,
        extendedLikesInfo: {
          likesCount: likesData.likes.length,
          dislikesCount: likesData.dislikes.length,
          myStatus,
          newestLikes: likesData.newestLikes,
        },
      };
    });

    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items,
    };
  }

  async getAllPostsWithPagination(query: GetPostsQueryDto, userId?: string) {
    const page = query.pageNumber || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const validSortFields: Record<string, string> = {
      title: 'p.title',
      created_at: 'p.created_at',
      short_description: 'p.short_description',
      blogName: 'b.name COLLATE "C"',
    };
    const sortBy = validSortFields[query.sortBy] || 'p.created_at';

    // Получаем посты
    const posts = await this.dataSource.query(
      `SELECT p.*, b.name as blogName
       FROM posts p
                LEFT JOIN blogs b ON p.blog_id = b.id
       ORDER BY ${sortBy} ${sortDirection}
       LIMIT $1 OFFSET $2`,
      [pageSize, skip],
    );

    const postIds = posts.map((p) => p.id);

    // Получаем все лайки для этих постов
    const rawLikes = await this.dataSource.query(
      `SELECT entity_id, user_id, user_login, status, created_at
       FROM likes
       WHERE entity_id = ANY($1) AND entity_type = 'Post'`,
      [postIds],
    );

    // Получаем статусы текущего пользователя (если он авторизован)
    const userLikesMap = new Map<string, string>();
    if (userId) {
      const userLikes = await this.dataSource.query(
        `SELECT entity_id, status 
       FROM likes 
       WHERE user_id = $1 AND entity_id = ANY($2) AND entity_type = 'Post'`,
        [userId, postIds],
      );

      userLikes.forEach((like) => {
        userLikesMap.set(like.entity_id, like.status);
      });
    }

    // Группируем лайки
    const likesMap = new Map<
      string,
      {
        likes: any[];
        dislikes: any[];
        newestLikes: any[];
      }
    >();

    for (const postId of postIds) {
      likesMap.set(postId, {
        likes: [],
        dislikes: [],
        newestLikes: [],
      });
    }

    for (const like of rawLikes) {
      const group = likesMap.get(like.entity_id);
      if (!group) continue;

      if (like.status === 'Like') {
        group.likes.push({
          addedAt: new Date(like.created_at).toISOString(),
          userId: like.user_id,
          login: like.user_login,
        });
      } else if (like.status === 'Dislike') {
        group.dislikes.push(like);
      }
    }

    // Общее количество постов
    const totalCountResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM posts`,
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);
    const pagesCount = Math.ceil(totalCount / pageSize);

    // Формируем результат
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: posts.map((p) => {
        const likesData = likesMap.get(p.id)!;
        const myStatus = userId ? userLikesMap.get(p.id) || 'None' : 'None';
        const newestLikes = likesData.likes
          .sort(
            (a, b) =>
              new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
          )
          .slice(0, 3);

        return {
          id: p.id,
          title: p.title,
          shortDescription: p.short_description,
          content: p.content,
          blogId: p.blog_id,
          blogName: p.blogname,
          createdAt: p.created_at,
          extendedLikesInfo: {
            likesCount: likesData.likes.length,
            dislikesCount: likesData.dislikes.length,
            myStatus: myStatus as 'Like' | 'Dislike' | 'None',
            newestLikes,
          },
        };
      }),
    };
  }

  async findPostById(postId: string, currentUserId?: string) {
    const result = await this.dataSource.query(
      `
          SELECT p.*, b.name as blogName
          FROM posts p
                   LEFT JOIN blogs b ON p.blog_id = b.id
          WHERE p.id = $1
      `,
      [postId],
    );

    const post = result[0];
    if (!post) return null;

    // 1. Подсчитать лайки и дизлайки
    const [likesCountResult, dislikesCountResult] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) FROM likes WHERE entity_id = $1 AND entity_type = 'Post' AND status = 'Like'`,
        [postId],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) FROM likes WHERE entity_id = $1 AND entity_type = 'Post' AND status = 'Dislike'`,
        [postId],
      ),
    ]);

    const likesCount = parseInt(likesCountResult[0].count, 10);
    const dislikesCount = parseInt(dislikesCountResult[0].count, 10);

    // 2. Получить статус текущего пользователя
    let myStatus = LikeStatus.None;
    if (currentUserId) {
      const statusResult = await this.dataSource.query(
        `SELECT status FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Post'`,
        [currentUserId, postId],
      );
      if (statusResult[0]) {
        myStatus = statusResult[0].status;
      }
    }

    // 3. Получить 3 последних лайка
    const newestLikes = await this.dataSource.query(
      `
    SELECT user_id AS "userId", user_login AS login, created_at AS "addedAt"
    FROM likes
    WHERE entity_id = $1 AND entity_type = 'Post' AND status = 'Like'
    ORDER BY created_at DESC
    LIMIT 3
    `,
      [postId],
    );

    return {
      id: post.id,
      title: post.title,
      shortDescription: post.short_description,
      content: post.content,
      blogId: post.blog_id,
      blogName: post.blogname,
      createdAt: post.created_at,
      extendedLikesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
        newestLikes,
      },
    };
  }

  async updatePost(
    postId: string,
    blogId: string,
    dto: UpdatePostDto,
  ): Promise<boolean> {
    console.log('UPDATE post', { postId, blogId, dto });
    const result = await this.dataSource.query(
      `
      UPDATE posts
      SET title = $1, short_description = $2, content = $3
      WHERE id = $4 AND blog_id = $5
      RETURNING id
      `,
      [dto.title, dto.shortDescription, dto.content, postId, blogId],
    );
    const updatedRows = result[0]; // это массив с обновленными строками
    return updatedRows.length > 0;
  }

  async deletePost(postId: string, blogId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
      DELETE FROM posts
      WHERE id = $1 AND blog_id = $2
      RETURNING id
      `,
      [postId, blogId],
    );
    const deletedRows = result[0]; // это массив с удалёнными строками
    return deletedRows.length > 0;
  }

  async updateLikeForPost(
    postId: string,
    userId: string,
    userLogin: string,
    status: LikeStatusEnum,
  ): Promise<void> {
    // Приводим статус к правильному регистру
    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    if (normalizedStatus === 'None') {
      await this.dataSource.query(
        `DELETE FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Post'`,
        [userId, postId],
      );
      return;
    }

    const existing = await this.dataSource.query(
      `SELECT * FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Post'`,
      [userId, postId],
    );

    if (existing.length > 0) {
      await this.dataSource.query(
        `UPDATE likes SET status = $1 WHERE user_id = $2 AND entity_id = $3 AND entity_type = 'Post'`,
        [normalizedStatus, userId, postId],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO likes (user_id, user_login, entity_id, entity_type, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, userLogin, postId, 'Post', normalizedStatus],
      );
    }
  }
}
