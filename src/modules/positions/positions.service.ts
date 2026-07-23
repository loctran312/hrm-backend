import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Position } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResult } from '../../common/types/api-response.type';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, toSkipTake } from '../../common/utils/pagination.util';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto, departmentId?: string): Promise<PaginatedResult<Position>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = { deletedAt: null, ...(departmentId ? { departmentId } : {}) };

    const [items, totalItems] = await Promise.all([
      this.prisma.position.findMany({ where, skip, take, orderBy: { title: 'asc' } }),
      this.prisma.position.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  async findOne(id: string): Promise<Position> {
    const position = await this.prisma.position.findFirst({ where: { id, deletedAt: null } });
    if (!position) {
      throw new NotFoundException('Không tìm thấy chức danh');
    }
    return position;
  }

  create(dto: CreatePositionDto): Promise<Position> {
    return this.prisma.position.create({ data: dto });
  }

  async update(id: string, dto: UpdatePositionDto): Promise<Position> {
    await this.findOne(id);
    return this.prisma.position.update({ where: { id }, data: dto });
  }

  async softDelete(id: string): Promise<void> {
    await this.findOne(id);

    const employeeCount = await this.prisma.employee.count({ where: { positionId: id, deletedAt: null } });
    if (employeeCount > 0) {
      throw new ConflictException(
        'Không thể xóa chức danh đang còn nhân viên. Vui lòng chuyển nhân viên sang chức danh khác trước.',
      );
    }

    await this.prisma.position.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
