import { IsEmail, IsString } from 'class-validator';

export class ConfirmRegistrationDto {
  @IsString()
  code: string;
}
export class PasswordRecoveryDto {
  @IsEmail()
  email: string;
}
