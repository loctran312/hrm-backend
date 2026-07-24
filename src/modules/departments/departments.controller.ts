import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiPaginatedQuery } from '../../common/decorators/api-paginated-query.decorator';
import { paginationQuerySchema, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  createDepartmentSchema,
  CreateDepartmentSwaggerDto,
  UpdateDepartmentDto,
  updateDepartmentSchema,
  UpdateDepartmentSwaggerDto,
} from './dto/department.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('department:view')
  @ApiPaginatedQuery()
  @ApiOperation({ summary: 'Danh sách phòng ban (phân trang)' })
  findAll(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto) {
    return this.departmentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('department:view')
  @ApiOperation({ summary: 'Chi tiết phòng ban' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @RequirePermissions('department:create')
  @ApiBody({ type: CreateDepartmentSwaggerDto })
  @ApiOperation({ summary: 'Tạo phòng ban mới' })
  create(@Body(new ZodValidationPipe(createDepartmentSchema)) dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('department:update')
  @ApiBody({ type: UpdateDepartmentSwaggerDto })
  @ApiOperation({ summary: 'Cập nhật phòng ban' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDepartmentSchema)) dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('department:delete')
  @ApiOperation({ summary: 'Xóa mềm phòng ban (chỉ khi không còn nhân viên)' })
  async remove(@Param('id') id: string) {
    await this.departmentsService.softDelete(id);
    return { id };
  }
}
