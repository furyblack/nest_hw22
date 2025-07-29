import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPostsQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageNumber?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc' = 'desc';
}
