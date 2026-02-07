import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    this.setCookies(res, result.cookies);

    return result.response;
  }

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    this.setCookies(res, result.cookies);

    return result.response;
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    
    if (refreshToken) {
      const refreshTokenHash = this.authService.hashRefreshToken(refreshToken);
      await this.authService.logout(refreshTokenHash);
    }

    this.clearCookies(res);

    return { message: 'Logged out successfully' };
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      this.clearCookies(res);
      return {
        success: false,
        error: {
          code: 'AUTH_REFRESH_INVALID',
          message: 'No refresh token provided',
        },
      };
    }

    const cookies = await this.authService.refresh(refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    this.setCookies(res, cookies);

    return { message: 'Token refreshed successfully' };
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user);
  }

  /**
   * Set authentication cookies
   */
  private setCookies(
    res: Response,
    cookies: {
      accessToken: string;
      refreshToken: string;
      accessMaxAge: number;
      refreshMaxAge: number;
    },
  ): void {
    const isProduction = this.configService.get('env.nodeEnv') === 'production';
    const cookieDomain = this.configService.get<string>('env.cookieDomain');

    // Access token cookie
    res.cookie('access_token', cookies.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: cookies.accessMaxAge,
      ...(isProduction && cookieDomain !== 'localhost' && { domain: cookieDomain }),
    });

    // Refresh token cookie
    res.cookie('refresh_token', cookies.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: cookies.refreshMaxAge,
      ...(isProduction && cookieDomain !== 'localhost' && { domain: cookieDomain }),
    });
  }

  /**
   * Clear authentication cookies
   */
  private clearCookies(res: Response): void {
    const isProduction = this.configService.get('env.nodeEnv') === 'production';
    const cookieDomain = this.configService.get<string>('env.cookieDomain');

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      ...(isProduction && cookieDomain !== 'localhost' && { domain: cookieDomain }),
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }
}
