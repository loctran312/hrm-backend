import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiPaginatedQuery } from '../../common/decorators/api-paginated-query.decorator';
import { paginationQuerySchema, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PositionsService } from './positions.service';
import {
  CreatePositionDto,
  createPositionSchema,
  CreatePositionSwaggerDto,
  UpdatePositionDto,
  updatePositionSchema,
  UpdatePositionSwaggerDto,
} from './dto/position.dto';

@ApiTags('Positions')
@ApiBearerAuth()
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  @RequirePermissions('position:view')
  @ApiPaginatedQuery()
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiOperation({ summary: 'Danh sách chức danh (phân trang, có thể lọc theo phòng ban)' })
  findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQueryDto,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.positionsService.findAll(query, departmentId);
  }

  @Get(':id')
  @RequirePermissions('position:view')
  @ApiOperation({ summary: 'Chi tiết chức danh' })
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Post()
  @RequirePermissions('position:create')
  @ApiBody({ type: CreatePositionSwaggerDto })
  @ApiOperation({ summary: 'Tạo chức danh mới' })
  create(@Body(new ZodValidationPipe(createPositionSchema)) dto: CreatePositionDto) {
    return this.positionsService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('position:update')
  @ApiBody({ type: UpdatePositionSwaggerDto })
  @ApiOperation({ summary: 'Cập nhật chức danh' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePositionSchema)) dto: UpdatePositionDto,
  ) {
    return this.positionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('position:delete')
  @ApiOperation({ summary: 'Xóa mềm chức danh (chỉ khi không còn nhân viên)' })
  async remove(@Param('id') id: string) {
    await this.positionsService.softDelete(id);
    return { id };
  }
}
