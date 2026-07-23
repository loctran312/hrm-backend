import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';

@Module({
  imports: [EmployeesModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
