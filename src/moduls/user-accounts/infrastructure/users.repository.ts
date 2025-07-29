import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GetUsersQueryDto } from '../dto/getUserQueryDto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeletionStatus, User } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: [
        { login: loginOrEmail, deletionStatus: DeletionStatus.ACTIVE },
        { email: loginOrEmail, deletionStatus: DeletionStatus.ACTIVE },
      ],
    });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = await this.userRepo.create(userData);
    return this.userRepo.save(user);
  }

  async findAllWithPagination(query: GetUsersQueryDto) {
    const page = query.pageNumber || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.deletionStatus = :status', { status: DeletionStatus.ACTIVE });

    if (query.searchLoginTerm) {
      qb.andWhere('LOWER(u.login) LIKE :login', {
        login: `%${query.searchLoginTerm.toLowerCase()}%`,
      });
    }
    if (query.searchEmailTerm) {
      qb.andWhere('LOWER(u.email) LIKE :email', {
        email: `%${query.searchEmailTerm.toLowerCase()}%`,
      });
    }

    const sortBy = ['login', 'email', 'createdAt'].includes(query.sortBy)
      ? query.sortBy
      : 'createdAt';
    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`u.${sortBy}`, sortDirection).skip(skip).take(pageSize);

    const [users, totalCount] = await qb.getManyAndCount();

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page,
      pageSize,
      totalCount,
      items: users.map((u) => ({
        id: u.id,
        login: u.login,
        email: u.email,
        createdAt: u.createdAt,
      })),
    };
  }

  async findById(id: string): Promise<any> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<any> {
    return this.userRepo.findOne({ where: { email } });
  }

  async deleteById(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }

  async findByConfirmationCode(code: string): Promise<any> {
    return this.userRepo.findOne({ where: { confirmationCode: code } });
  }
  async confirmUserEmail(id: string): Promise<void> {
    await this.userRepo.update(id, {
      isEmailConfirmed: true,
      confirmationCode: null,
      confirmationCodeExpiration: null,
    });
  }

  async updateConfirmationCode(id: string, code: string, expiration: Date) {
    await this.userRepo.update(id, {
      confirmationCode: code,
      confirmationCodeExpiration: expiration,
    });
  }
}
