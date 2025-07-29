import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { GetUsersQueryDto } from '../dto/getUserQueryDto';
import { CreateUserInputDto } from '../dto/create-input-dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async createUserAndReturnDto(dto: CreateUserInputDto) {
    const existingUser =
      (await this.usersRepository.findByLoginOrEmail(dto.login)) ||
      (await this.usersRepository.findByLoginOrEmail(dto.email));
    if (existingUser) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'User with same login or email exists',
            field: existingUser.login === dto.login ? 'login' : 'email',
          },
        ],
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.createUser({
      login: dto.login,
      email: dto.email,
      passwordHash: passwordHash,
      confirmationCode: uuidv4(),
      isEmailConfirmed: false,
    });

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async getAllUsersWithPagination(query: GetUsersQueryDto) {
    return this.usersRepository.findAllWithPagination(query);
  }

  async getUserByIdOutput(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.created_at,
    };
  }

  async deleteById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    await this.usersRepository.deleteById(id);
  }
}
