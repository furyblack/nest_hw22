import { IsString, Length, Matches, MaxLength } from 'class-validator';
import { Trim } from '../decorators/trim-decorator';

export class CreateBlogDto {
  @Trim()
  @IsString()
  @Length(1, 15)
  name: string;

  @Trim()
  @IsString()
  @Length(1, 500)
  description: string;

  @Trim()
  @IsString()
  @MaxLength(100)
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
    {
      message: 'websiteUrl must match required pattern',
    },
  )
  websiteUrl: string;
}
export class UpdateBlogDto {
  @Trim()
  @IsString()
  @Length(1, 15)
  name: string;

  @Trim()
  @IsString()
  @Length(1, 500)
  description: string;

  @Trim()
  @IsString()
  @Length(1, 100)
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
    {
      message: 'websiteUrl must match required pattern',
    },
  )
  websiteUrl: string;
}
