# HRM Backend

## Setup lần đầu

```bash
npm install

cp .env.example .env

npm run prisma:generate

npm run start:dev
```

- App: http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs

## Lưu ý
  chạy migration lần đầu:
  
  ```bash
  npm run prisma:migrate:dev -- --name init_schema
  ```
