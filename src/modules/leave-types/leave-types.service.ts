import { Injectable, NotFoundException } from '@nestjs/common';
import { LeaveType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeaveTypeDto } from './dto/leave-type.dto';

@Injectable()
export class LeaveTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive(): Promise<LeaveType[]> {
    return this.prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<LeaveType> {
    const leaveType = await this.prisma.leaveType.findFirst({ where: { id, isActive: true } });
    if (!leaveType) {
      throw new NotFoundException('Không tìm thấy loại nghỉ phép');
    }
    return leaveType;
  }

  create(dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return this.prisma.leaveType.create({ data: dto });
  }

  async deactivate(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.leaveType.update({ where: { id }, data: { isActive: false } });
  }
}
