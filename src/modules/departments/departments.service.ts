import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Department } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResult } from '../../common/types/api-response.type';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, toSkipTake } from '../../common/utils/pagination.util';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Department>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = { deletedAt: null };

    const [items, totalItems] = await Promise.all([
      this.prisma.department.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.department.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.prisma.department.findFirst({ where: { id, deletedAt: null } });
    if (!department) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }
    return department;
  }

  create(dto: CreateDepartmentDto): Promise<Department> {
    return this.prisma.department.create({ data: dto });
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    await this.findOne(id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async softDelete(id: string): Promise<void> {
    await this.findOne(id);

    const employeeCount = await this.prisma.employee.count({
      where: { departmentId: id, deletedAt: null },
    });
    if (employeeCount > 0) {
      throw new ConflictException(
        'Không thể xóa phòng ban đang còn nhân viên. Vui lòng chuyển nhân viên sang phòng ban khác trước.',
      );
    }

    await this.prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
