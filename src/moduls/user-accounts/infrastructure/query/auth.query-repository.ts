import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { MeViewDto } from '../../dto/currentUserDto';

@Injectable()
export class AuthQueryRepository {
  constructor(private userRepository: UsersRepository) {}

  async me(userId: string): Promise<MeViewDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return MeViewDto.mapToView(user);
  }
}
