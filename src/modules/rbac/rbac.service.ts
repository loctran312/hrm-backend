import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissionCodes(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, role: { isActive: true } },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { permission: { isActive: true } },
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissionCodes = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        permissionCodes.add(rolePermission.permission.code);
      }
    }

    return Array.from(permissionCodes);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Không tìm thấy role');
    }

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
  }

  listRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  listPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  }
}
