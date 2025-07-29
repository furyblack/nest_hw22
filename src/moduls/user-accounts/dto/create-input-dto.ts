import { IsString, Length, IsEmail } from 'class-validator';

export class CreateUserInputDto {
  login: string;
  email: string;
  password: string;
}

export class LoginDto {
  @IsString()
  loginOrEmail: string;
  @IsString()
  password: string;
}

export class CreateUserDto {
  @IsString()
  @Length(3, 10)
  login: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsEmail()
  email: string;
}
