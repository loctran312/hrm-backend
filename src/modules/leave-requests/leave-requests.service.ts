import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRequest } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResult } from '../../common/types/api-response.type';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, toSkipTake } from '../../common/utils/pagination.util';
import { CreateLeaveRequestDto, RejectLeaveRequestDto } from './dto/leave-request.dto';

@Injectable()
export class LeaveRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(employeeId: string, dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const totalDays = this.calculateTotalDays(dto.startDate, dto.endDate);

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays,
        reason: dto.reason,
      },
    });
  }

  async approve(id: string, approverId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.findPendingOrThrow(id);

    return this.prisma.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: { status: 'APPROVED', approverId, approvedAt: new Date() },
    });
  }

  async reject(id: string, approverId: string, dto: RejectLeaveRequestDto): Promise<LeaveRequest> {
    const leaveRequest = await this.findPendingOrThrow(id);

    return this.prisma.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: {
        status: 'REJECTED',
        approverId,
        approvedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });
  }

  async cancel(id: string, employeeId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.prisma.leaveRequest.findFirst({ where: { id, employeeId } });
    if (!leaveRequest) {
      throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
    }
    if (leaveRequest.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy đơn đang ở trạng thái chờ duyệt');
    }

    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async findForEmployee(employeeId: string, query: PaginationQueryDto): Promise<PaginatedResult<LeaveRequest>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = { employeeId };

    const [items, totalItems] = await Promise.all([
      this.prisma.leaveRequest.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  async findAll(
    query: PaginationQueryDto,
    filter: { employeeId?: string; status?: string } = {},
  ): Promise<PaginatedResult<LeaveRequest>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.status ? { status: filter.status as LeaveRequest['status'] } : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.leaveRequest.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query.page, query.limit, totalItems) };
  }

  private async findPendingOrThrow(id: string): Promise<LeaveRequest> {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leaveRequest) {
      throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
    }
    if (leaveRequest.status !== 'PENDING') {
      throw new BadRequestException('Đơn này đã được xử lý trước đó');
    }
    return leaveRequest;
  }

  private calculateTotalDays(startDate: Date, endDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  }
}
