import { IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => String)
  sortBy: string = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  @Type(() => String)
  sortDirection: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 10;

  @IsOptional()
  @Type(() => String)
  searchLoginTerm?: string;

  @IsOptional()
  @Type(() => String)
  searchEmailTerm?: string;
}
