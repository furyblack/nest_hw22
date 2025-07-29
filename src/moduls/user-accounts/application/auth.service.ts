import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from '../infrastructure/auth.repository';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserInputDto, LoginDto } from '../dto/create-input-dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../../notifications/email.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async registerUser(dto: CreateUserInputDto): Promise<void> {
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
    const confirmationCode = uuidv4();

    const user = await this.authRepository.createUser({
      login: dto.login,
      email: dto.email,
      passwordHash,
      confirmationCode,
      isEmailConfirmed: false,
    });

    this.emailService
      .sendConfirmationEmail(user.email, confirmationCode)
      .catch((err) => console.error('Email sending error:', err));
  }

  private generateAccessToken(userId: string, login: string): string {
    return this.jwtService.sign(
      { userId, login },
      { secret: 'ACCESS_SECRET', expiresIn: '350s' },
    );
  }

  private generateRefreshToken(userId: string, deviceId: string): string {
    return this.jwtService.sign(
      { userId, deviceId },
      { secret: 'REFRESH_SECRET', expiresIn: '350s' },
    );
  }

  async login(
    dto: LoginDto,
    ip: string,
    userAgent: string,
    response: Response,
  ): Promise<{ accessToken: string }> {
    console.log(dto.loginOrEmail, 'input loginOrEmail');

    const user = await this.usersRepository.findByLoginOrEmail(
      dto.loginOrEmail,
    );
    console.log(user, 'user from login');
    if (!user || user.deletionStatus !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const deviceId = randomUUID();
    const accessToken = this.generateAccessToken(user.id, user.login);
    const refreshToken = this.generateRefreshToken(user.id, deviceId);

    // Декодируем токен, чтобы вытащить `iat`
    const payload = this.jwtService.decode(refreshToken) as any;
    const lastActiveDate = new Date(payload.iat * 1000);

    // Сохраняем сессию
    await this.sessionService.createSession({
      userId: user.id,
      deviceId,
      ip,
      title: userAgent,
      lastActiveDate,
    });

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 20 * 1000,
    });

    return { accessToken };
  }

  async confirmRegistration(code: string): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);

    if (!user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'Invalid confirmation code',
            field: 'code',
          },
        ],
      });
    }

    if (user.is_email_confirmed) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'User already confirmed',
            field: 'code',
          },
        ],
      });
    }

    if (
      user.confirmation_code_expiration &&
      new Date(user.confirmation_code_expiration) < new Date()
    ) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'Confirmation code expired',
            field: 'code',
          },
        ],
      });
    }

    await this.usersRepository.confirmUserEmail(user.id);
  }
  async emailResending(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'Such user not found',
            field: 'email',
          },
        ],
      });
    }

    if (user.is_email_confirmed) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'User already confirmed',
            field: 'email',
          },
        ],
      });
    }

    const newCode = randomUUID();
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 часа

    await this.usersRepository.updateConfirmationCode(
      user.id,
      newCode,
      expiration,
    );
    await this.emailService.sendConfirmationEmail(user.email, newCode);
  }

  async refreshToken(oldToken: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(oldToken, {
        secret: process.env.REFRESH_SECRET || 'REFRESH_SECRET',
      });
    } catch (e) {
      console.error('Refresh token error:', e);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.sessionService.findSessionByDeviceIdAndDate(
      payload.deviceId,
      payload.iat,
    );

    if (!session) {
      throw new UnauthorizedException('Session not found or token reused');
    }

    const user = await this.usersRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newAccessToken = this.generateAccessToken(user.id, user.login);
    const newRefreshToken = this.generateRefreshToken(
      user.id,
      payload.deviceId,
    );

    const newPayload = this.jwtService.decode(newRefreshToken) as any;

    await this.sessionService.updateSessionLastActiveDate(
      payload.deviceId,
      payload.iat,
      newPayload.iat,
    );

    return { newAccessToken, newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    await this.sessionService.deleteSessionByDeviceIdAndDate(
      payload.deviceId,
      payload.iat,
    );
  }
}
