import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AppConfigService } from '../../config/env.config';
import { UsersService } from '../users/users.service';
import { RbacService } from '../rbac/rbac.service';
import { JwtPayload } from '../../common/types/auth.type';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ id: string; email: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.create(dto.email, passwordHash);

    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const permissions = await this.rbacService.getUserPermissionCodes(user.id);
    return this.issueTokenPair(user.id, user.email, permissions);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.appConfig.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã bị thu hồi');
    }

    // Rotation: thu hồi token cũ ngay khi dùng
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không còn hoạt động');
    }

    const permissions = await this.rbacService.getUserPermissionCodes(user.id);
    return this.issueTokenPair(user.id, user.email, permissions);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const isOldPasswordValid = await argon2.verify(user.passwordHash, dto.oldPassword);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Mật khẩu cũ không đúng');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);
    await this.usersService.updatePasswordHash(userId, newPasswordHash);

    // Buộc đăng nhập lại ở mọi thiết bị sau khi đổi mật khẩu
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(userId: string, email: string, permissions: string[]): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, permissions };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.appConfig.jwtAccessSecret,
      expiresIn: this.appConfig.jwtAccessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.appConfig.jwtRefreshSecret,
      expiresIn: this.appConfig.jwtRefreshExpiresIn,
    });

    const expiresAt = this.computeExpiryDate(this.appConfig.jwtRefreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private computeExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

    return new Date(Date.now() + value * unitMs[unit]);
  }
}
