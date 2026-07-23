# HRM Backend

## Setup lần đầu

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env từ mẫu, rồi điền giá trị thật (đặc biệt DATABASE_URL, JWT secrets)
cp .env.example .env

# 3. Generate Prisma Client (bắt buộc chạy lại mỗi khi schema.prisma thay đổi)
npm run prisma:generate

# 4. Chạy migration lần đầu (cần PostgreSQL đang chạy, DATABASE_URL đúng trong .env)
npm run prisma:migrate:dev -- --name init_schema

# 5. Seed dữ liệu mặc định (Role/Permission/tài khoản Admin)
npm run prisma:seed

# 6. Chạy unit test
npm test

# 7. Chạy app ở chế độ dev (watch mode)
npm run start:dev
```

Sau khi chạy, kiểm tra:
- App: http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs

Đăng nhập lần đầu bằng tài khoản Admin đã seed:
```
POST /auth/login
{ "email": "admin@hrm.local", "password": "ChangeMe123!" }
```
Đổi mật khẩu ngay qua `POST /auth/change-password`.

Xem `PROJECT_STATUS.md` để biết tổng kết toàn bộ dự án, RBAC matrix, và technical debt còn tồn đọng.
