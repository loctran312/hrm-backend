import { ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../../database/prisma.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: {
    department: { findFirst: jest.Mock; findMany: jest.Mock; count: jest.Mock; create: jest.Mock; update: jest.Mock };
    employee: { count: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      department: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employee: { count: jest.fn() },
    };
    service = new DepartmentsService(prisma as unknown as PrismaService);
  });

  describe('findOne', () => {
    it('ném NotFoundException nếu không tìm thấy hoặc đã bị soft-delete', async () => {
      prisma.department.findFirst.mockResolvedValue(null);
      await expect(service.findOne('dep-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('ném ConflictException nếu phòng ban còn nhân viên (rủi ro đã lường ở Giai đoạn 2)', async () => {
      prisma.department.findFirst.mockResolvedValue({ id: 'dep-1', deletedAt: null });
      prisma.employee.count.mockResolvedValue(3);

      await expect(service.softDelete('dep-1')).rejects.toThrow(ConflictException);
      expect(prisma.department.update).not.toHaveBeenCalled();
    });

    it('xóa mềm thành công nếu không còn nhân viên nào', async () => {
      prisma.department.findFirst.mockResolvedValue({ id: 'dep-1', deletedAt: null });
      prisma.employee.count.mockResolvedValue(0);
      prisma.department.update.mockResolvedValue({ id: 'dep-1', deletedAt: new Date() });

      await service.softDelete('dep-1');

      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 'dep-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
