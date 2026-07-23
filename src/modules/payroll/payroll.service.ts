import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Payroll } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResult } from '../../common/types/api-response.type';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, toSkipTake } from '../../common/utils/pagination.util';
import { CalculatePayrollDto } from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(dto: CalculatePayrollDto): Promise<Payroll> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    const basicSalary = employee.basicSalary;
    const netSalary = basicSalary.toNumber() + dto.totalAllowance - dto.totalDeduction;

    if (netSalary < 0) {
      throw new BadRequestException('Lương thực nhận không được âm — kiểm tra lại khoản khấu trừ');
    }

    const existing = await this.prisma.payroll.findUnique({
      where: {
        employeeId_periodYear_periodMonth: {
          employeeId: dto.employeeId,
          periodYear: dto.periodYear,
          periodMonth: dto.periodMonth,
        },
      },
    });

    if (existing && existing.status !== 'DRAFT') {
      throw new ConflictException('Kỳ lương này đã được LOCKED/PAID, không thể tính lại');
    }

    const data = {
      employeeId: dto.employeeId,
      periodMonth: dto.periodMonth,
      periodYear: dto.periodYear,
      basicSalary,
      totalAllowance: dto.totalAllowance,
      totalDeduction: dto.totalDeduction,
      netSalary,
      calculatedAt: new Date(),
    };

    if (existing) {
      return this.prisma.payroll.update({ where: { id: existing.id }, data });
    }
    return this.prisma.payroll.create({ data });
  }

  async lock(id: string): Promise<Payroll> {
    const payroll = await this.findOneOrThrow(id);
    if (payroll.status !== 'DRAFT') {
      throw new ConflictException('Chỉ có thể lock kỳ lương đang ở trạng thái DRAFT');
    }
    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'LOCKED', lockedAt: new Date() },
    });
  }

  async markPaid(id: string): Promise<Payroll> {
    const payroll = await this.findOneOrThrow(id);
    if (payroll.status !== 'LOCKED') {
      throw new ConflictException('Chỉ có thể đánh dấu PAID cho kỳ lương đã LOCKED');
    }
    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async findForEmployee(employeeId: string, query: PaginationQueryDto): Promise<PaginatedResult<Payroll>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = { employeeId };

    const [items, totalItems] = await Promise.all([
      this.prisma.payroll.findMany({
        where,
        skip,
        take,
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      }),
      this.prisma.payroll.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  async findAll(
    query: PaginationQueryDto,
    filter: { employeeId?: string; periodMonth?: number; periodYear?: number } = {},
  ): Promise<PaginatedResult<Payroll>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.periodMonth ? { periodMonth: filter.periodMonth } : {}),
      ...(filter.periodYear ? { periodYear: filter.periodYear } : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.payroll.findMany({
        where,
        skip,
        take,
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      }),
      this.prisma.payroll.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  private async findOneOrThrow(id: string): Promise<Payroll> {
    const payroll = await this.prisma.payroll.findUnique({ where: { id } });
    if (!payroll) {
      throw new NotFoundException('Không tìm thấy phiếu lương');
    }
    return payroll;
  }
}
