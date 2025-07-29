import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { GetBlogsQueryDto } from '../dto/getBlogsQueryDto';

@Injectable()
export class BlogsService {
  constructor(private blogsRepository: BlogsRepository) {}
  async createBlog(dto: CreateBlogDto) {
    return this.blogsRepository.createBlog(dto);
  }

  async getBlogById(id: string) {
    const blog = await this.blogsRepository.findBlogById(id);
    if (!blog) throw new NotFoundException(`Blog with id ${id} not found`);
    return blog;
  }

  async getAllBlogs(query: GetBlogsQueryDto) {
    return this.blogsRepository.getAllBlogsWithPagination(query);
  }
  async updateBlog(id: string, dto: UpdateBlogDto): Promise<void> {
    await this.blogsRepository.updateBlog(id, dto);
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.deleteBlog(id);
  }
}
