import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiPaginatedQuery } from '../../common/decorators/api-paginated-query.decorator';
import { paginationQuerySchema, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/types/auth.type';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceService } from './attendance.service';
import {
  CheckInDto,
  checkInSchema,
  CheckInSwaggerDto,
  CheckOutDto,
  checkOutSchema,
  CheckOutSwaggerDto,
} from './dto/check-in-out.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Post('me/check-in')
  @ApiBody({ type: CheckInSwaggerDto })
  @ApiOperation({ summary: 'Check-in cho chính mình' })
  async checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(checkInSchema)) dto: CheckInDto,
  ) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.attendanceService.checkIn(employee.id, dto);
  }

  @Post('me/check-out')
  @ApiBody({ type: CheckOutSwaggerDto })
  @ApiOperation({ summary: 'Check-out cho chính mình' })
  async checkOut(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(checkOutSchema)) dto: CheckOutDto,
  ) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.attendanceService.checkOut(employee.id, dto);
  }

  @Get('me')
  @ApiPaginatedQuery()
  @ApiOperation({ summary: 'Lịch sử chấm công của chính mình (phân trang)' })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
  ) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.attendanceService.findForEmployee(employee.id, query);
  }

  @Get()
  @RequirePermissions('attendance:view')
  @ApiPaginatedQuery()
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiOperation({ summary: 'Lịch sử chấm công toàn hệ thống (HR/Manager, filter theo nhân viên)' })
  findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.attendanceService.findAll(query, employeeId);
  }
}
