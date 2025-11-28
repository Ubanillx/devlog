# DevLog Database Setup Guide

## 📋 概述

该 SQL schema 为 DevLog 博客系统提供完整的 PostgreSQL 数据库结构，包含以下功能：

- ✅ 博客文章管理（草稿/发布状态）
- ✅ 标签系统（多对多关系）
- ✅ 嵌套评论（支持回复）
- ✅ 管理员账户
- ✅ 文章浏览统计
- ✅ AI 生成摘要和阅读时间
- ✅ 软删除机制
- ✅ 自动时间戳更新

## 🗂️ 数据表结构

### 1. `admins` - 管理员表
- 管理后台登录账户
- 包含用户名、邮箱、密码哈希
- 支持最后登录时间追踪

### 2. `blog_posts` - 博客文章表
- 存储文章标题、摘要、内容（Markdown）
- 支持草稿/发布状态切换
- 自动计算阅读时长
- 浏览量统计

### 3. `tags` - 标签表
- 独立的标签管理
- 自动统计标签使用次数
- URL 友好的 slug 字段

### 4. `post_tags` - 文章-标签关联表
- 实现多对多关系
- 自动触发器更新标签使用计数

### 5. `comments` - 评论表
- 支持嵌套回复（通过 `parent_id`）
- 区分访客/管理员评论
- 软删除支持

### 6. `ai_generated_content` - AI 生成内容表
- 存储 AI 生成的文章摘要和阅读时间
- 记录 AI 模型和 token 使用情况
- 支持多次生成和版本管理
- 追踪生成状态和应用状态

## 🚀 快速开始

### 1. 创建数据库

```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE devlog;

# 连接到数据库
\c devlog
```

### 2. 执行建表脚本

```bash
# 从文件执行 SQL
psql -U postgres -d devlog -f schema.sql
```

或在 psql 交互模式中：

```sql
\i /path/to/schema.sql
```

### 3. 验证表创建

```sql
-- 查看所有表
\dt

-- 查看表结构
\d blog_posts
\d comments
\d tags

-- 查看视图
\dv
```

## 🔐 安全配置

### 修改默认管理员密码

**重要！** schema 中包含一个默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

**请立即修改密码：**

```go
// 在 Go 中生成新的密码哈希
import "golang.org/x/crypto/bcrypt"

hash, _ := bcrypt.GenerateFromPassword([]byte("your_new_password"), bcrypt.DefaultCost)
```

```sql
-- 更新数据库中的密码
UPDATE admins 
SET password_hash = '$2a$10$NEW_HASH_HERE' 
WHERE username = 'admin';
```

### 创建数据库用户

```sql
-- 创建专用数据库用户
CREATE USER devlog_user WITH PASSWORD 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE devlog TO devlog_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO devlog_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO devlog_user;
```

## 📊 有用的查询示例

### 获取所有已发布文章及标签

```sql
SELECT * FROM published_posts_with_tags;
```

### 获取文章的评论树

```sql
-- 获取某篇文章的所有顶级评论
SELECT * FROM comment_threads 
WHERE post_id = 'your-post-uuid';

-- 获取某条评论的所有回复
SELECT * FROM comments 
WHERE parent_id = 'parent-comment-uuid' 
  AND is_deleted = FALSE
ORDER BY created_at ASC;
```

### 获取热门标签

```sql
SELECT name, use_count 
FROM tags 
ORDER BY use_count DESC 
LIMIT 10;
```

### 统计文章数据

```sql
-- 总文章数（已发布/草稿）
SELECT 
    is_published,
    COUNT(*) as count
FROM blog_posts
GROUP BY is_published;

-- 总浏览量
SELECT SUM(view_count) as total_views FROM blog_posts;
```

### AI 生成内容管理

```sql
-- 获取文章的最新 AI 生成建议
SELECT 
    p.title,
    ai.generated_excerpt,
    ai.generated_read_time,
    ai.ai_model,
    ai.status,
    ai.created_at
FROM blog_posts p
LEFT JOIN ai_generated_content ai ON p.id = ai.post_id
WHERE ai.id = (
    SELECT id FROM ai_generated_content 
    WHERE post_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 获取待审核的 AI 生成内容
SELECT 
    p.title,
    ai.generated_excerpt,
    ai.status,
    ai.created_at
FROM ai_generated_content ai
JOIN blog_posts p ON ai.post_id = p.id
WHERE ai.is_applied = FALSE AND ai.status = 'success'
ORDER BY ai.created_at DESC;

-- 应用 AI 生成的摘要到文章
UPDATE blog_posts 
SET 
    excerpt = (SELECT generated_excerpt FROM ai_generated_content WHERE id = 'ai-content-uuid'),
    read_time = (SELECT generated_read_time FROM ai_generated_content WHERE id = 'ai-content-uuid')
WHERE id = 'post-uuid';

UPDATE ai_generated_content 
SET is_applied = TRUE, applied_at = CURRENT_TIMESTAMP, status = 'applied'
WHERE id = 'ai-content-uuid';

-- 统计 AI 使用情况
SELECT 
    ai_model,
    COUNT(*) as generation_count,
    SUM(prompt_tokens) as total_prompt_tokens,
    SUM(completion_tokens) as total_completion_tokens,
    AVG(prompt_tokens + completion_tokens) as avg_tokens_per_request
FROM ai_generated_content
WHERE status = 'success'
GROUP BY ai_model;
```

## 🔧 触发器说明

### 1. 自动更新 `updated_at`
- `blog_posts` 和 `comments` 表在更新时自动更新时间戳
- 无需手动维护

### 2. 自动更新标签使用计数
- 当文章添加/删除标签时，`tags.use_count` 自动更新
- 用于热门标签排序

## 🗺️ ER 图关系

```
admins (1) ----< (N) blog_posts
blog_posts (N) ----< (M) post_tags >---- (M) tags
blog_posts (1) ----< (N) comments
blog_posts (1) ----< (N) ai_generated_content
comments (1) ----< (N) comments (自关联，parent_id)
```

## 📝 字段约束

### 数据校验
- ✅ 邮箱格式验证（admins.email）
- ✅ 角色枚举验证（comments.role: 'guest' | 'admin'）
- ✅ AI 状态枚举验证（ai_generated_content.status: 'pending' | 'success' | 'failed' | 'applied'）
- ✅ 非负数验证（view_count, use_count, prompt_tokens, completion_tokens）
- ✅ 内容非空验证（comments.content）

### 级联操作
- 删除文章时，自动删除关联的标签关系、评论和 AI 生成内容
- 删除评论时，自动删除所有子评论
- 删除管理员时，文章的 author_id 设为 NULL

## 🔄 迁移和备份

### 备份数据库

```bash
pg_dump -U postgres devlog > devlog_backup.sql
```

### 恢复数据库

```bash
psql -U postgres devlog < devlog_backup.sql
```

## 🌐 连接配置（Go 示例）

```go
import (
    "database/sql"
    _ "github.com/lib/pq"
)

connStr := "host=localhost port=5432 user=devlog_user password=your_password dbname=devlog sslmode=disable"
db, err := sql.Open("postgres", connStr)
```

## 📦 Go 依赖

```bash
go get github.com/lib/pq
go get golang.org/x/crypto/bcrypt
```

## 🐛 常见问题

### Q: UUID 扩展未安装？
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Q: 如何重置数据库？
```sql
DROP DATABASE devlog;
CREATE DATABASE devlog;
\c devlog
\i schema.sql
```

### Q: 如何查看触发器？
```sql
\dft
```

## 📚 下一步

1. 在 Go 后端实现 CRUD API
2. 集成 JWT 认证
3. 实现文章搜索功能（考虑 PostgreSQL Full-Text Search）
4. 添加速率限制和防刷机制
5. 实现 RSS feed 生成

---

**Created:** 2024-11-20  
**Database:** PostgreSQL 12+  
**License:** MIT
