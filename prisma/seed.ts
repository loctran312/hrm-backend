import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'employee:view',
  'employee:create',
  'employee:update',
  'employee:delete',
  'department:view',
  'department:create',
  'department:update',
  'department:delete',
  'position:view',
  'position:create',
  'position:update',
  'position:delete',
  'attendance:view',
  'leave:view',
  'leave:approve',
  'leave:manage-types',
  'payroll:view',
  'payroll:manage',
  'salary:view',
  'salary:update',
  'role:manage',
  'permission:manage',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: PERMISSIONS,
  HR: [
    'employee:view',
    'employee:create',
    'employee:update',
    'employee:delete',
    'department:view',
    'department:create',
    'department:update',
    'department:delete',
    'position:view',
    'position:create',
    'position:update',
    'position:delete',
    'attendance:view',
    'leave:view',
    'leave:approve',
    'leave:manage-types',
    'payroll:view',
    'payroll:manage',
    'salary:view',
    'salary:update',
  ],
  Manager: ['employee:view', 'department:view', 'position:view', 'attendance:view', 'leave:view', 'leave:approve'],
  Employee: [],
};

async function main(): Promise<void> {
  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    const permissions = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  const adminEmail = 'admin@hrm.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash('ChangeMe123!');
    const adminUser = await prisma.user.create({ data: { email: adminEmail, passwordHash } });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Admin' } });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });

    // eslint-disable-next-line no-console
    console.log(`✅ Seeded Admin: ${adminEmail} / ChangeMe123! (đổi mật khẩu ngay sau khi đăng nhập lần đầu)`);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed hoàn tất');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
