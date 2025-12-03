# Docker 部署指南

## 快速开始

### 1. 生成管理员密码

首先生成你的管理员密码哈希：

```bash
cd backend/cmd/genhash

# 编辑 main.go，将 password 修改为你想要的密码
# password := "yourpassword"  改为你的密码

# 运行生成哈希
go run main.go
```

复制输出的哈希值，然后编辑 `backend/schema.sql`，找到 INSERT 语句并替换：

```sql
INSERT INTO admins (username, email, password_hash) 
SELECT 'your_username', 'your_email@example.com', '你生成的哈希值'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'your_username');
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的参数
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 4. 访问服务

- **前端**: http://localhost
- **后端 API**: http://localhost:8080
- **Swagger 文档**: http://localhost:8080/swagger/index.html

## 服务说明

| 服务 | 端口 | 描述 |
|------|------|------|
| frontend | 80 | Nginx 静态文件服务 |
| backend | 8080 | Go API 服务 |
| postgres | 5432 | PostgreSQL 数据库 |

## 常用命令

```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷（清除数据库）
docker compose down -v

# 重新构建特定服务
docker compose build backend
docker compose build frontend

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend

# 进入容器
docker compose exec backend sh
docker compose exec postgres psql -U devlog -d devlog
```

## 生产环境部署

### 1. 修改环境变量

```bash
# .env 文件
DB_PASSWORD=强密码
JWT_SECRET=随机生成的密钥
GIN_MODE=release
VITE_API_BASE_URL=https://your-domain.com/api/v1
```

### 2. 配置反向代理（可选）

如果需要 HTTPS，建议在前面加一层 Nginx 或 Traefik 作为反向代理。

### 3. 数据备份

```bash
# 备份数据库
docker compose exec postgres pg_dump -U devlog devlog > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T postgres psql -U devlog devlog
```

## 开发模式

如果只需要数据库，可以单独启动：

```bash
docker compose up -d postgres
```

然后在本地运行前后端进行开发。

## 故障排除

### 数据库连接失败

1. 确认 PostgreSQL 容器正在运行
2. 检查环境变量配置
3. 等待数据库健康检查通过

```bash
docker compose logs postgres
```

### 前端无法连接后端

1. 确认 `VITE_API_BASE_URL` 配置正确
2. 检查 CORS 配置
3. 确认后端服务正常运行

```bash
docker compose logs backend
```
