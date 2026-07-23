# HRM Backend — Tổng kết dự án

Trạng thái: **Khung xương production-ready hoàn chỉnh, sẵn sàng chạy migration + seed + test ở môi trường có PostgreSQL/network thật.**

## 1. Các giai đoạn đã hoàn thành

| # | Giai đoạn | Trạng thái |
|---|---|---|
| 0 | Kiến trúc tổng thể | ✅ |
| 1 | Project setup (Config, Prisma connection, Global filter/interceptor, Helmet/CORS/Compression, Swagger) | ✅ |
| 2 | Database schema đầy đủ (13 model, 5 enum) | ✅ |
| 3 | Auth (Register/Login/Refresh/Logout/Change Password, JWT rotation) | ✅ |
| 4 | RBAC (Role/Permission bảng động, seed mặc định) | ✅ |
| 5 | Employees/Departments/Positions (CRUD + soft delete + pagination) | ✅ |
| 6 | Attendance (check-in/out, lịch sử) | ✅ |
| 7 | LeaveRequest (nhiều loại nghỉ, 1 cấp duyệt) | ✅ |
| 8 | Payroll (snapshot, lock, mark-paid) | ✅ |
| 9 | Testing (Jest, unit test cho Auth/Departments/Payroll/ZodValidationPipe) | ✅ (chưa chạy được do sandbox không có network) |
| 10 | Review tổng thể, dọn technical debt | ✅ (tài liệu này) |

## 2. Review theo REVIEW MODE

### SOLID
- Mỗi module chỉ export Service ra ngoài (Controller không public), Employee/Attendance/LeaveRequest/Payroll đều tuân thủ hướng phụ thuộc 1 chiều đã thiết kế ở Giai đoạn 0 (payroll → employees, attendance → employees, không có chiều ngược lại).
- `PermissionsGuard`/`JwtAuthGuard` tách biệt rõ 2 trách nhiệm (xác thực vs phân quyền), đúng Single Responsibility.

### Bug đã phát hiện và sửa trong quá trình tự review
- **Bug nghiêm trọng**: `@UsePipes()` method-level áp dụng pipe cho TẤT CẢ tham số handler (kể cả `@Param`, `@CurrentUser`), không riêng `@Body`/`@Query` cần validate → gây lỗi 400 sai ở mọi endpoint có nhiều hơn 1 loại tham số. Đã sửa toàn bộ 9 controller sang gắn pipe trực tiếp vào từng parameter decorator (`@Body(new ZodValidationPipe(schema))`).
- **Rủi ro kiểu dữ liệu**: `Number(prismaDecimalInstance)` phụ thuộc coercion ngầm của decimal.js → đổi sang `.toNumber()` tường minh trong `PayrollService`.

### Dependency vòng
- Không có. `EmployeesModule` là điểm phụ thuộc chung cho Attendance/LeaveRequests/Payroll nhưng không phụ thuộc ngược lại module nào trong số đó.

### Technical debt còn tồn đọng (đã cân nhắc, chấp nhận được ở giai đoạn MVP)
1. **1 cấp duyệt LeaveRequest chưa ràng buộc đúng người quản lý trực tiếp** — bất kỳ ai có permission `leave:approve` (Manager/HR/Admin) đều duyệt được mọi đơn, chưa kiểm tra `approver.id === employee.managerId`. Nếu cần chặt hơn, bổ sung check này trong `LeaveRequestsService.approve()`.
2. **Không có audit log** cho hành động nhạy cảm (sửa lương, duyệt/từ chối nghỉ phép, xóa nhân viên) — HRM thực tế thường cần bảng `AuditLog` riêng. Chưa làm vì không nằm trong yêu cầu ban đầu.
3. **Đăng ký tài khoản (`/auth/register`) hiện public, không giới hạn** — với HRM nội bộ thực tế, nên tắt public register và để Admin/HR tạo tài khoản qua endpoint riêng có permission. Đang để public để tiện test end-to-end; cân nhắc đổi `@Public()` thành yêu cầu `user:create` permission trước khi lên production thật.
4. **Chưa chạy được `npm install`, `prisma migrate dev`, `npm test` thật** — sandbox không có network/DB. Code đã được rà soát kỹ bằng mắt (đặc biệt tên compound unique key Prisma, kiểu dữ liệu Decimal) nhưng chưa qua `tsc --noEmit` hay test runner thật. Đây là rủi ro lớn nhất còn lại — xem mục 4 để tự verify.

## 3. RBAC Matrix (tóm tắt)

| Permission | Admin | HR | Manager | Employee |
|---|---|---|---|---|
| employee:view/create/update/delete | ✅ | ✅ | view only | chỉ `/me` |
| department/position:view/create/update/delete | ✅ | ✅ | view only | ❌ |
| attendance:view (toàn hệ thống) | ✅ | ✅ | ✅ | chỉ `/me` |
| leave:view/approve | ✅ | ✅ | ✅ | chỉ `/me` |
| leave:manage-types | ✅ | ✅ | ❌ | ❌ |
| payroll:view/manage | ✅ | ✅ | ❌ | chỉ `/me` |
| role:manage / permission:manage | ✅ | ❌ | ❌ | ❌ |

## 4. Hướng dẫn verify ở máy local (bắt buộc trước khi dùng thật)

```bash
npm install
cp .env.example .env        # điền DATABASE_URL trỏ tới PostgreSQL thật + JWT secrets
npx tsc --noEmit             # kiểm tra type-check toàn bộ
npm run prisma:generate
npm run prisma:migrate:dev -- --name init_schema
npm run prisma:seed          # tạo Role/Permission mặc định + tài khoản Admin
npm test                     # chạy unit test đã viết ở Giai đoạn 9
npm run start:dev
```

Sau khi chạy xong, đăng nhập bằng:
```
POST /auth/login
{ "email": "admin@hrm.local", "password": "ChangeMe123!" }
```
→ đổi mật khẩu ngay qua `POST /auth/change-password`.

## 5. Đề xuất bước tiếp theo (ngoài phạm vi roadmap ban đầu, nếu cần mở rộng)
- Bảng `AuditLog` cho hành động nhạy cảm.
- Ràng buộc approver = quản lý trực tiếp cho LeaveRequest.
- Rate limiting cho `/auth/login` (chống brute-force).
- CI pipeline chạy `tsc --noEmit` + `jest` + `prisma migrate diff` trên mỗi PR.
