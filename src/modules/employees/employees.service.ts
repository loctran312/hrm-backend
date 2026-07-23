import { Injectable, NotFoundException } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResult } from '../../common/types/api-response.type';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, toSkipTake } from '../../common/utils/pagination.util';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

export interface EmployeeFilter {
  departmentId?: string;
  positionId?: string;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto, filter: EmployeeFilter = {}): Promise<PaginatedResult<Employee>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      deletedAt: null,
      ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
      ...(filter.positionId ? { positionId: filter.positionId } : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.employee.findMany({ where, skip, take, orderBy: { fullName: 'asc' } }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.prisma.employee.findFirst({ where: { id, deletedAt: null } });
    if (!employee) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }
    return employee;
  }

  async findByUserId(userId: string): Promise<Employee> {
    const employee = await this.prisma.employee.findFirst({ where: { userId, deletedAt: null } });
    if (!employee) {
      throw new NotFoundException('Tài khoản của bạn chưa được gắn với hồ sơ nhân viên nào');
    }
    return employee;
  }

  create(dto: CreateEmployeeDto): Promise<Employee> {
    return this.prisma.employee.create({ data: dto });
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  async softDelete(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'TERMINATED' },
    });
  }
}
