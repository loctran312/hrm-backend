import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../database/prisma.service';

function fakeDecimal(value: number) {
  return { toNumber: () => value };
}

describe('PayrollService', () => {
  let service: PayrollService;
  let prisma: {
    employee: { findFirst: jest.Mock };
    payroll: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      employee: { findFirst: jest.fn() },
      payroll: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    service = new PayrollService(prisma as unknown as PrismaService);
  });

  describe('calculate', () => {
    it('ném NotFoundException nếu không tìm thấy nhân viên', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.calculate({ employeeId: 'emp-1', periodMonth: 1, periodYear: 2026, totalAllowance: 0, totalDeduction: 0 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném BadRequestException nếu netSalary âm', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', basicSalary: fakeDecimal(5_000_000) });

      await expect(
        service.calculate({
          employeeId: 'emp-1',
          periodMonth: 1,
          periodYear: 2026,
          totalAllowance: 0,
          totalDeduction: 10_000_000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném ConflictException nếu kỳ lương đã LOCKED/PAID', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', basicSalary: fakeDecimal(10_000_000) });
      prisma.payroll.findUnique.mockResolvedValue({ id: 'p-1', status: 'LOCKED' });

      await expect(
        service.calculate({ employeeId: 'emp-1', periodMonth: 1, periodYear: 2026, totalAllowance: 0, totalDeduction: 0 }),
      ).rejects.toThrow(ConflictException);
    });

    it('tính netSalary = basic + allowance - deduction và tạo mới khi chưa có payroll', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', basicSalary: fakeDecimal(10_000_000) });
      prisma.payroll.findUnique.mockResolvedValue(null);
      prisma.payroll.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'p-new', ...data }),
      );

      const result = await service.calculate({
        employeeId: 'emp-1',
        periodMonth: 3,
        periodYear: 2026,
        totalAllowance: 1_000_000,
        totalDeduction: 500_000,
      });

      expect(result.netSalary).toBe(10_500_000);
      expect(prisma.payroll.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('lock', () => {
    it('ném ConflictException nếu không ở trạng thái DRAFT', async () => {
      prisma.payroll.findUnique.mockResolvedValue({ id: 'p-1', status: 'LOCKED' });
      await expect(service.lock('p-1')).rejects.toThrow(ConflictException);
    });

    it('lock thành công khi đang DRAFT', async () => {
      prisma.payroll.findUnique.mockResolvedValue({ id: 'p-1', status: 'DRAFT' });
      prisma.payroll.update.mockResolvedValue({ id: 'p-1', status: 'LOCKED' });

      const result = await service.lock('p-1');
      expect(result.status).toBe('LOCKED');
    });
  });

  describe('markPaid', () => {
    it('ném ConflictException nếu chưa LOCKED', async () => {
      prisma.payroll.findUnique.mockResolvedValue({ id: 'p-1', status: 'DRAFT' });
      await expect(service.markPaid('p-1')).rejects.toThrow(ConflictException);
    });
  });
});
