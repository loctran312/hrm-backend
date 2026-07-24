import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiPaginatedQuery } from '../../common/decorators/api-paginated-query.decorator';
import { paginationQuerySchema, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/types/auth.type';
import { EmployeesService } from '../employees/employees.service';
import { LeaveRequestsService } from './leave-requests.service';
import {
  CreateLeaveRequestDto,
  createLeaveRequestSchema,
  CreateLeaveRequestSwaggerDto,
  leaveRequestStatusFilterSchema,
  RejectLeaveRequestDto,
  rejectLeaveRequestSchema,
  RejectLeaveRequestSwaggerDto,
} from './dto/leave-request.dto';

@ApiTags('Leave Requests')
@ApiBearerAuth()
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(
    private readonly leaveRequestsService: LeaveRequestsService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Post('me')
  @ApiBody({ type: CreateLeaveRequestSwaggerDto })
  @ApiOperation({ summary: 'Tạo đơn nghỉ phép cho chính mình' })
  async createMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createLeaveRequestSchema)) dto: CreateLeaveRequestDto,
  ) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.leaveRequestsService.create(employee.id, dto);
  }

  @Get('me')
  @ApiPaginatedQuery()
  @ApiOperation({ summary: 'Danh sách đơn nghỉ phép của chính mình' })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
  ) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.leaveRequestsService.findForEmployee(employee.id, query);
  }

  @Post('me/:id/cancel')
  @ApiOperation({ summary: 'Hủy đơn nghỉ phép của chính mình (chỉ khi đang PENDING)' })
  async cancelMine(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.leaveRequestsService.cancel(id, employee.id);
  }

  @Get()
  @RequirePermissions('leave:view')
  @ApiPaginatedQuery()
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiOperation({ summary: 'Danh sách đơn nghỉ phép toàn hệ thống (HR/Manager)' })
  findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
    @Query('employeeId') employeeId?: string,
    @Query('status', new ZodValidationPipe(leaveRequestStatusFilterSchema)) status?: string,
  ) {
    return this.leaveRequestsService.findAll(query, { employeeId, status });
  }

  @Post(':id/approve')
  @RequirePermissions('leave:approve')
  @ApiOperation({ summary: 'Duyệt đơn nghỉ phép (Manager/HR/Admin)' })
  async approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const approver = await this.employeesService.findByUserId(user.userId);
    return this.leaveRequestsService.approve(id, approver.id);
  }

  @Post(':id/reject')
  @RequirePermissions('leave:approve')
  @ApiBody({ type: RejectLeaveRequestSwaggerDto })
  @ApiOperation({ summary: 'Từ chối đơn nghỉ phép (Manager/HR/Admin)' })
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectLeaveRequestSchema)) dto: RejectLeaveRequestDto,
  ) {
    const approver = await this.employeesService.findByUserId(user.userId);
    return this.leaveRequestsService.reject(id, approver.id, dto);
  }
}
