import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlogsViewDto } from '../../dto/blog-view.dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(private dataSource: DataSource) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogsViewDto> {
    const result = await this.dataSource.query(
      `SELECT * FROM blogs WHERE id = $1 AND deletion_status = 'active'`,
      [id],
    );

    if (!result || result.length === 0) {
      throw new NotFoundException('Blog not found');
    }

    return BlogsViewDto.mapToView(result[0]);
  }
}
