import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { RbacService } from '../rbac/rbac.service';
import { AppConfigService } from '../../config/env.config';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { refreshToken: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock } };
  let usersService: { findByEmail: jest.Mock; create: jest.Mock; findById: jest.Mock; updatePasswordHash: jest.Mock };
  let rbacService: { getUserPermissionCodes: jest.Mock };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let appConfig: Partial<AppConfigService>;

  beforeEach(() => {
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    rbacService = { getUserPermissionCodes: jest.fn().mockResolvedValue(['employee:view']) };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token'), verify: jest.fn() };
    appConfig = {
      jwtAccessSecret: 'access-secret-at-least-32-characters-long',
      jwtAccessExpiresIn: '15m',
      jwtRefreshSecret: 'refresh-secret-at-least-32-characters-long',
      jwtRefreshExpiresIn: '7d',
    };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      usersService as unknown as UsersService,
      rbacService as unknown as RbacService,
      jwtService as unknown as JwtService,
      appConfig as AppConfigService,
    );
  });

  describe('register', () => {
    it('ném ConflictException nếu email đã tồn tại', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com' });

      await expect(authService.register({ email: 'a@b.com', password: 'password123' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('hash password trước khi lưu, không lưu plaintext', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((email: string, passwordHash: string) =>
        Promise.resolve({ id: '1', email, passwordHash }),
      );

      await authService.register({ email: 'new@b.com', password: 'plainPassword123' });

      const [, passwordHashArg] = usersService.create.mock.calls[0] as [string, string];
      expect(passwordHashArg).not.toBe('plainPassword123');
      expect(await argon2.verify(passwordHashArg, 'plainPassword123')).toBe(true);
    });
  });

  describe('login', () => {
    it('ném UnauthorizedException nếu không tìm thấy user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login({ email: 'notfound@b.com', password: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('ném UnauthorizedException nếu sai mật khẩu', async () => {
      const correctHash = await argon2.hash('correct-password');
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        passwordHash: correctHash,
        isActive: true,
      });

      await expect(authService.login({ email: 'a@b.com', password: 'wrong-password' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('trả về access + refresh token khi đăng nhập thành công', async () => {
      const correctHash = await argon2.hash('correct-password');
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: correctHash,
        isActive: true,
      });

      const result = await authService.login({ email: 'a@b.com', password: 'correct-password' });

      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' });
      expect(rbacService.getUserPermissionCodes).toHaveBeenCalledWith('user-1');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });
  });
});
