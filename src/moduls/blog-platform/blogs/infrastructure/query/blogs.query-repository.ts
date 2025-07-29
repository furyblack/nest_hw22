import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlogsViewDto } from '../../dto/blog-view.dto';
import { Blog } from '../../domain/blog.enity';

@Injectable()
export class BlogsQueryRepository {
  constructor(private dataSource: DataSource) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogsViewDto> {
    const blog = await this.dataSource
      .getRepository(Blog)
      .createQueryBuilder('blog')
      .where('blog.id = :id', { id })
      .getOne();
    if (!blog) throw new NotFoundException('Blog not found');
    return BlogsViewDto.mapToView(blog);
  }
}
