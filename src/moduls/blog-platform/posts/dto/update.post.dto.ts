import { IsString, Length } from 'class-validator';
import { Trim } from '../../blogs/decorators/trim-decorator';

export class UpdatePostDto {
  @IsString()
  @Trim()
  @Length(1, 30)
  title: string;

  @IsString()
  @Trim()
  @Length(1, 100)
  shortDescription: string;

  @IsString()
  @Trim()
  @Length(1, 1000)
  content: string;
}
