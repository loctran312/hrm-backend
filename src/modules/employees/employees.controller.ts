import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { paginationQuerySchema, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/types/auth.type';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, createEmployeeSchema, UpdateEmployeeDto, updateEmployeeSchema } from './dto/employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Xem hồ sơ nhân viên của chính mình' })
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.findByUserId(user.userId);
  }

  @Get()
  @RequirePermissions('employee:view')
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'positionId', required: false })
  @ApiOperation({ summary: 'Danh sách nhân viên (phân trang, filter theo phòng ban/chức danh)' })
  findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
    @Query('departmentId') departmentId?: string,
    @Query('positionId') positionId?: string,
  ) {
    return this.employeesService.findAll(query, { departmentId, positionId });
  }

  @Get(':id')
  @RequirePermissions('employee:view')
  @ApiOperation({ summary: 'Chi tiết nhân viên' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @RequirePermissions('employee:create')
  @ApiOperation({ summary: 'Tạo hồ sơ nhân viên mới' })
  create(@Body(new ZodValidationPipe(createEmployeeSchema)) dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('employee:update')
  @ApiOperation({ summary: 'Cập nhật hồ sơ nhân viên' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEmployeeSchema)) dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('employee:delete')
  @ApiOperation({ summary: 'Xóa mềm nhân viên (đánh dấu TERMINATED)' })
  async remove(@Param('id') id: string) {
    await this.employeesService.softDelete(id);
    return { id };
  }
}
