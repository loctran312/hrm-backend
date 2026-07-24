import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface DepartmentHeadcount {
  departmentId: string;
  departmentName: string;
  activeEmployeeCount: number;
}

export interface TodayAttendanceSummary {
  present: number;
  late: number;
  onLeave: number;
  notCheckedIn: number;
}

export interface PayrollStatusSummary {
  draft: number;
  locked: number;
  paid: number;
}

export interface DashboardOverview {
  totalActiveEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  employeesByDepartment: DepartmentHeadcount[];
  pendingLeaveRequests: number;
  todayAttendance: TodayAttendanceSummary;
  currentMonthPayroll: PayrollStatusSummary;
}

export interface MyDashboard {
  attendanceThisMonth: number;
  pendingLeaveRequests: number;
  latestPayslip: {
    periodMonth: number;
    periodYear: number;
    netSalary: number;
    status: string;
  } | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<DashboardOverview> {
    const today = this.todayDateOnly();
    const { month, year } = this.currentPeriod();

    const [
      totalActiveEmployees,
      totalDepartments,
      totalPositions,
      employeesByDepartmentGroups,
      departments,
      pendingLeaveRequests,
      todayAttendanceGroups,
      currentMonthPayrollGroups,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.department.count({ where: { deletedAt: null } }),
      this.prisma.position.count({ where: { deletedAt: null } }),
      this.prisma.employee.groupBy({
        by: ['departmentId'],
        where: { deletedAt: null, status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.department.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { date: today },
        _count: { _all: true },
      }),
      this.prisma.payroll.groupBy({
        by: ['status'],
        where: { periodMonth: month, periodYear: year },
        _count: { _all: true },
      }),
    ]);

    const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));
    const employeesByDepartment: DepartmentHeadcount[] = employeesByDepartmentGroups.map((group) => ({
      departmentId: group.departmentId,
      departmentName: departmentNameById.get(group.departmentId) ?? 'Không xác định',
      activeEmployeeCount: group._count._all,
    }));

    const attendanceCountByStatus = new Map(todayAttendanceGroups.map((g) => [g.status, g._count._all]));
    const totalCheckedInToday = todayAttendanceGroups.reduce((sum, g) => sum + g._count._all, 0);
    const todayAttendance: TodayAttendanceSummary = {
      present: attendanceCountByStatus.get('PRESENT') ?? 0,
      late: attendanceCountByStatus.get('LATE') ?? 0,
      onLeave: attendanceCountByStatus.get('ON_LEAVE') ?? 0,
      notCheckedIn: Math.max(totalActiveEmployees - totalCheckedInToday, 0),
    };

    const payrollCountByStatus = new Map(currentMonthPayrollGroups.map((g) => [g.status, g._count._all]));
    const currentMonthPayroll: PayrollStatusSummary = {
      draft: payrollCountByStatus.get('DRAFT') ?? 0,
      locked: payrollCountByStatus.get('LOCKED') ?? 0,
      paid: payrollCountByStatus.get('PAID') ?? 0,
    };

    return {
      totalActiveEmployees,
      totalDepartments,
      totalPositions,
      employeesByDepartment,
      pendingLeaveRequests,
      todayAttendance,
      currentMonthPayroll,
    };
  }

  async getMyDashboard(employeeId: string): Promise<MyDashboard> {
    const { start, end } = this.currentMonthRange();

    const [attendanceThisMonth, pendingLeaveRequests, latestPayslip] = await Promise.all([
      this.prisma.attendance.count({ where: { employeeId, date: { gte: start, lte: end } } }),
      this.prisma.leaveRequest.count({ where: { employeeId, status: 'PENDING' } }),
      this.prisma.payroll.findFirst({
        where: { employeeId },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      }),
    ]);

    return {
      attendanceThisMonth,
      pendingLeaveRequests,
      latestPayslip: latestPayslip
        ? {
            periodMonth: latestPayslip.periodMonth,
            periodYear: latestPayslip.periodYear,
            netSalary: latestPayslip.netSalary.toNumber(),
            status: latestPayslip.status,
          }
        : null,
    };
  }

  // Nhất quán với AttendanceService: date-only theo UTC (xem attendance.service.ts).
  private todayDateOnly(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  private currentPeriod(): { month: number; year: number } {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  private currentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    return { start, end };
  }
}
