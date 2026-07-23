import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { paginationQuerySchema, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/types/auth.type';
import { EmployeesService } from '../employees/employees.service';
import { PayrollService } from './payroll.service';
import { CalculatePayrollDto, calculatePayrollSchema } from './dto/payroll.dto';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Xem phiếu lương của chính mình' })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
  ) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.payrollService.findForEmployee(employee.id, query);
  }

  @Get()
  @RequirePermissions('payroll:view')
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'periodMonth', required: false })
  @ApiQuery({ name: 'periodYear', required: false })
  @ApiOperation({ summary: 'Danh sách phiếu lương toàn hệ thống (HR/Admin)' })
  findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
    @Query('employeeId') employeeId?: string,
    @Query('periodMonth') periodMonth?: string,
    @Query('periodYear') periodYear?: string,
  ) {
    return this.payrollService.findAll(query, {
      employeeId,
      periodMonth: periodMonth ? Number(periodMonth) : undefined,
      periodYear: periodYear ? Number(periodYear) : undefined,
    });
  }

  @Post('calculate')
  @RequirePermissions('payroll:manage')
  @ApiOperation({ summary: 'Tính lương cho 1 nhân viên trong 1 kỳ (HR/Admin)' })
  calculate(@Body(new ZodValidationPipe(calculatePayrollSchema)) dto: CalculatePayrollDto) {
    return this.payrollService.calculate(dto);
  }

  @Post(':id/lock')
  @RequirePermissions('payroll:manage')
  @ApiOperation({ summary: 'Chốt kỳ lương (DRAFT → LOCKED), không thể tính lại sau khi lock' })
  lock(@Param('id') id: string) {
    return this.payrollService.lock(id);
  }

  @Post(':id/mark-paid')
  @RequirePermissions('payroll:manage')
  @ApiOperation({ summary: 'Đánh dấu đã trả lương (LOCKED → PAID)' })
  markPaid(@Param('id') id: string) {
    return this.payrollService.markPaid(id);
  }
}
