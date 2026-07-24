import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/auth.type';
import { EmployeesService } from '../employees/employees.service';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Get('overview')
  @RequirePermissions('dashboard:view')
  @ApiOperation({
    summary: 'Tổng quan toàn công ty (Admin/HR/Manager): headcount, chấm công hôm nay, đơn nghỉ phép chờ duyệt, payroll tháng hiện tại',
  })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('me')
  @ApiOperation({ summary: 'Tổng quan cá nhân: chấm công tháng này, đơn nghỉ phép chờ duyệt, phiếu lương gần nhất' })
  async getMyDashboard(@CurrentUser() user: AuthenticatedUser) {
    const employee = await this.employeesService.findByUserId(user.userId);
    return this.dashboardService.getMyDashboard(employee.id);
  }
}
