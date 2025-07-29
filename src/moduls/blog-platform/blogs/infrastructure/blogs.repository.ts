import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { GetBlogsQueryDto } from '../dto/getBlogsQueryDto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog.enity';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog)
    private blogRepo: Repository<Blog>,
  ) {}

  async createBlog(dto: CreateBlogDto): Promise<Blog> {
    const blog = this.blogRepo.create({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      isMembership: false,
    });

    return this.blogRepo.save(blog);
  }
  async findBlogById(id: string): Promise<Blog | null> {
    return this.blogRepo.findOne({ where: { id } });
  }
  async getAllBlogsWithPagination(query: GetBlogsQueryDto) {
    const page = query.pageNumber || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const qb = this.blogRepo.createQueryBuilder('b');

    // 1) фильтр
    if (query.searchNameTerm) {
      qb.where('LOWER(b.name) LIKE :term', {
        term: `%${query.searchNameTerm.toLowerCase()}%`,
      });
    }

    // 2) сортировка
    const sortBy = ['name', 'websiteUrl', 'createdAt'].includes(query.sortBy)
      ? query.sortBy
      : 'createdAt';
    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (sortBy === 'name') {
      qb
        // прямой порядок по name в байтовой колляции
        .orderBy('b.name COLLATE "C"', sortDirection);
    } else if (sortBy === 'websiteUrl') {
      qb.orderBy('b.websiteUrl', sortDirection);
    } else {
      qb.orderBy('b.createdAt', sortDirection).addOrderBy(
        'b.id',
        sortDirection,
      );
    }

    // 3) пагинация — ОБЯЗАТЕЛЬНО использовать take + skip
    qb.skip(skip).take(pageSize);

    // 4) выполнить запрос
    const [blogs, totalCount] = await qb.getManyAndCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    // 5) маппинг в нужный формат и порядок полей
    const items = blogs.map((b) => ({
      name: b.name,
      description: b.description,
      websiteUrl: b.websiteUrl,
      isMembership: b.isMembership,
      id: b.id,
      createdAt: b.createdAt.toISOString(),
    }));

    return { pagesCount, page, pageSize, totalCount, items };
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<void> {
    const result = await this.blogRepo.update(id, {
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Blog not found');
    }
  }

  async deleteBlog(id: string): Promise<void> {
    const result = await this.blogRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Blog not found');
    }
  }
}
