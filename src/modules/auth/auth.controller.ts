import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../../common/types/auth.type';
import { AuthService } from './auth.service';
import { RegisterDto, registerSchema, RegisterSwaggerDto } from './dto/register.dto';
import { LoginDto, loginSchema, LoginSwaggerDto } from './dto/login.dto';
import { RefreshTokenDto, refreshTokenSchema, RefreshTokenSwaggerDto } from './dto/refresh-token.dto';
import { ChangePasswordDto, changePasswordSchema, ChangePasswordSwaggerDto } from './dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiBody({ type: RegisterSwaggerDto })
  @ApiOperation({ summary: 'Đăng ký tài khoản mới (chưa gắn Employee)' })
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto): Promise<{ id: string; email: string }> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginSwaggerDto })
  @ApiOperation({ summary: 'Đăng nhập, trả về access token + refresh token' })
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenSwaggerDto })
  @ApiOperation({ summary: 'Cấp access token + refresh token mới (rotation)' })
  refresh(@Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiBody({ type: RefreshTokenSwaggerDto })
  @ApiOperation({ summary: 'Thu hồi refresh token hiện tại' })
  logout(@Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordSwaggerDto })
  @ApiOperation({ summary: 'Đổi mật khẩu, thu hồi toàn bộ refresh token hiện có' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(user.userId, dto);
  }
}
