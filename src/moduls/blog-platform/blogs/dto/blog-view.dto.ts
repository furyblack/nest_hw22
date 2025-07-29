import { Blog } from '../domain/blog.enity';

export class BlogResponseDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export class BlogsViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;

  static mapToView(blog: Blog): BlogsViewDto {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt:
        blog.createdAt instanceof Date
          ? blog.createdAt.toISOString()
          : blog.createdAt,
      isMembership: blog.isMembership,
    };
  }
}
