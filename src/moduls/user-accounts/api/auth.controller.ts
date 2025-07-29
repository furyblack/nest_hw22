import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { CreateUserDto, LoginDto } from '../dto/create-input-dto';
import { Request, Response } from 'express';
import {
  ConfirmRegistrationDto,
  PasswordRecoveryDto,
} from '../dto/confirmation-registration-dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MeViewDto } from '../dto/currentUserDto';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../decarators/extract-user-from-request';
import { UserContextDto } from '../dto/user.context.dto';
import { Cookies } from '../decarators/cookies.decorator';
import { RefreshTokenGuardPower } from '../guards/bearer/refreshToken-guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private authQueryRepo: AuthQueryRepository,
  ) {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async registration(@Body() dto: CreateUserDto): Promise<void> {
    await this.authService.registerUser(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const userAgent = request.headers['user-agent'] ?? 'unknown';
    const ip = request.ip ?? 'unknown';
    return this.authService.login(dto, ip, userAgent, response);
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async confirmRegistration(
    @Body() dto: ConfirmRegistrationDto,
  ): Promise<void> {
    await this.authService.confirmRegistration(dto.code);
  }

  @Post('registration-email-resending')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(@Body() dto: PasswordRecoveryDto): Promise<void> {
    await this.authService.emailResending(dto.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return await this.authQueryRepo.me(user.userId);
  }
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { newAccessToken, newRefreshToken } =
      await this.authService.refreshToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 20 * 1000,
    });

    return { accessToken: newAccessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuardPower)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refreshToken;
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken');
  }
}
