import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RbacService } from './rbac.service';
import { AssignRoleDto, assignRoleSchema, AssignRoleSwaggerDto } from './dto/assign-role.dto';

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Danh sách role đang active' })
  listRoles() {
    return this.rbacService.listRoles();
  }

  @Get('permissions')
  @RequirePermissions('permission:manage')
  @ApiOperation({ summary: 'Danh sách permission đang active' })
  listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Post('users/:userId/roles')
  @RequirePermissions('role:manage')
  @ApiBody({ type: AssignRoleSwaggerDto })
  @ApiOperation({ summary: 'Gán role cho user' })
  assignRole(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(assignRoleSchema)) dto: AssignRoleDto,
  ) {
    return this.rbacService.assignRoleToUser(userId, dto.roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Gỡ role khỏi user' })
  removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.rbacService.removeRoleFromUser(userId, roleId);
  }
}
