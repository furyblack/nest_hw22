import { IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCommentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortDirection?: 'asc' | 'desc' = 'desc';
}
