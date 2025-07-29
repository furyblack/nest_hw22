import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../domain/user.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createUser(data: {
    login: string;
    email: string;
    passwordHash: string;
    confirmationCode: string;
    isEmailConfirmed: boolean;
  }): Promise<User> {
    const user = this.userRepo.create({
      login: data.login,
      email: data.email,
      passwordHash: data.passwordHash,
      confirmationCode: data.confirmationCode,
      isEmailConfirmed: data.isEmailConfirmed,
    });
    return this.userRepo.save(user);
  }
}
