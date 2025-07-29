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

  static mapToView(blog: any): BlogsViewDto {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.website_url,
      createdAt:
        blog.created_at instanceof Date
          ? blog.created_at.toISOString()
          : blog.created_at,
      isMembership: blog.is_membership,
    };
  }
}
