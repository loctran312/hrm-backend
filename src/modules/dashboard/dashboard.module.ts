import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [EmployeesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
