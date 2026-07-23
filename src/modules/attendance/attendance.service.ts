import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Attendance } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResult } from '../../common/types/api-response.type';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, toSkipTake } from '../../common/utils/pagination.util';
import { CheckInDto, CheckOutDto } from './dto/check-in-out.dto';

const WORK_START_HOUR = 9;

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(employeeId: string, dto: CheckInDto): Promise<Attendance> {
    const today = this.todayDateOnly();

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing?.checkInAt) {
      throw new ConflictException('Bạn đã check-in hôm nay rồi');
    }

    const now = new Date();
    const status = now.getHours() >= WORK_START_HOUR ? 'LATE' : 'PRESENT';

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkInAt: now, status, note: dto.note },
      });
    }

    return this.prisma.attendance.create({
      data: { employeeId, date: today, checkInAt: now, status, note: dto.note },
    });
  }

  async checkOut(employeeId: string, dto: CheckOutDto): Promise<Attendance> {
    const today = this.todayDateOnly();

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!existing || !existing.checkInAt) {
      throw new BadRequestException('Bạn chưa check-in hôm nay');
    }
    if (existing.checkOutAt) {
      throw new ConflictException('Bạn đã check-out hôm nay rồi');
    }

    return this.prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOutAt: new Date(), note: dto.note ?? existing.note },
    });
  }

  async findForEmployee(employeeId: string, query: PaginationQueryDto): Promise<PaginatedResult<Attendance>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = { employeeId };

    const [items, totalItems] = await Promise.all([
      this.prisma.attendance.findMany({ where, skip, take, orderBy: { date: 'desc' } }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  async findAll(query: PaginationQueryDto, employeeId?: string): Promise<PaginatedResult<Attendance>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = employeeId ? { employeeId } : {};

    const [items, totalItems] = await Promise.all([
      this.prisma.attendance.findMany({ where, skip, take, orderBy: { date: 'desc' } }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  private todayDateOnly(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
}
