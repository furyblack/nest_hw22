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
      website: dto.websiteUrl,
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

    //фильтр по имени

    if (query.searchNameTerm) {
      qb.andWhere('LOWER(b.name) LIKE :name', {
        name: `%${query.searchNameTerm.toLowerCase()}%`,
      });
    }
    //сортировка

    const sortBy = ['name', 'website_url', 'created_at'].includes(query.sortBy)
      ? query.sortBy
      : 'created_at';

    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`b.${sortBy}`, sortDirection).skip(skip).take(pageSize);

    const [blogs, totalCount] = await qb.getManyAndCount();

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page,
      pageSize,
      totalCount,
      items: blogs.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        websiteUrl: b.website,
      })),
    };
  }

  async findOrNotFoundFail(id: string): Promise<Blog> {
    const blog = await this.findBlogById(id);
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<void> {
    const result = await this.blogRepo.update(id, {
      name: dto.name,
      description: dto.description,
      website: dto.websiteUrl,
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
