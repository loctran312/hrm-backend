import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto, createLeaveTypeSchema } from './dto/leave-type.dto';

@ApiTags('Leave Types')
@ApiBearerAuth()
@Controller('leave-types')
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách loại nghỉ phép đang active (mọi user đã đăng nhập đều xem được)' })
  findAll() {
    return this.leaveTypesService.findAllActive();
  }

  @Post()
  @RequirePermissions('leave:manage-types')
  @ApiOperation({ summary: 'Tạo loại nghỉ phép mới (HR/Admin)' })
  create(@Body(new ZodValidationPipe(createLeaveTypeSchema)) dto: CreateLeaveTypeDto) {
    return this.leaveTypesService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('leave:manage-types')
  @ApiOperation({ summary: 'Vô hiệu hóa loại nghỉ phép (HR/Admin)' })
  async remove(@Param('id') id: string) {
    await this.leaveTypesService.deactivate(id);
    return { id };
  }
}
