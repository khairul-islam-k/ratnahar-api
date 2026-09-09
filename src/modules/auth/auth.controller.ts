import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { AuthUser, RefreshAuthUser } from './types/auth-user.type';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

type RequestWithUser = Request & {
  user: AuthUser;
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Login user',
  })
  login(@Body() _dto: LoginDto, @Req() request: RequestWithUser) {
    return this.authService.login(request.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get authenticated user',
  })
  profile(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Generate new access token',
  })
  refresh(@CurrentUser() user: RefreshAuthUser) {
    return this.authService.refreshToken(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout user',
  })
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }
}
