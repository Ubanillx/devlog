# DevLog 后端

DevLog 是一个使用 Go (Golang) 构建的个人开发者博客后端 API。它提供了一套完整的 RESTful API，用于管理博客文章、评论、标签，并集成了 AI 服务以增强功能。

## 🚀 技术栈

- **编程语言：** [Go 1.25](https://go.dev/)
- **Web 框架：** [Gin](https://github.com/gin-gonic/gin)
- **数据库 ORM：** [GORM](https://gorm.io/)
- **数据库：** PostgreSQL
- **身份认证：** JWT (JSON Web Tokens)
- **API 文档：** [Swagger](https://github.com/swaggo/swag)
- **AI 集成：** [LangChainGo](https://github.com/tmc/langchaingo)
- **对象存储：** 阿里云 OSS

## ✨ 功能特性

- **文章管理：**
  - 文章的增删改查 (CRUD)
  - 支持 Markdown 内容格式
  - 标签系统
  - 发布/草稿状态管理
  - 全文搜索（标题/摘要）

- **评论系统：**
  - 访客公开评论
  - 管理员回复
  - 内容审核工具（软删除）

- **认证与安全：**
  - 管理员 JWT 登录
  - 受保护的内容管理路由
  - SSL/TLS 支持 (JKS 证书)

- **AI 能力：**
  - 支持多种 AI 服务提供商 (OpenAI, Gemini, Ollama, 阿里云百炼/通义千问)
  - AI 辅助功能（如：内容摘要、智能问答）

- **SEO 与分析：**
  - 自动向百度、Bing 提交 URL
  - SEO 友好的 URL 结构

- **系统功能：**
  - 健康检查端点
  - 优雅关闭 (Graceful Shutdown)
  - 支持 Docker 部署

## 🛠️ 环境要求

- Go 1.25+
- PostgreSQL 12+
- Git

## 📦 安装与配置

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd devlog/backend
   ```

2. **安装依赖**
   ```bash
   go mod download
   ```

3. **数据库配置**
   - 创建名为 `devlog` 的 PostgreSQL 数据库。
   - 应用使用 GORM 自动迁移，你也可以参考 `schema.sql` 中的数据库结构和 `DATABASE_SETUP.md` 中的配置指南。

4. **环境变量配置**
   - 复制示例环境文件：
     ```bash
     cp .env.example .env
     ```
   - 编辑 `.env` 文件，填写你的配置：
     - 数据库凭证 (`DB_HOST`, `DB_USER`, `DB_PASSWORD` 等)
     - 服务器设置 (`SERVER_PORT`, `GIN_MODE`)
     - AI 服务配置（可选）
     - OSS 和 SEO 配置（可选）

5. **生成管理员密码**
   - 使用内置工具生成密码哈希值：
     ```bash
     go run cmd/genhash/main.go -password "你的管理员密码"
     ```
   - 将管理员用户手动插入数据库，或使用种子脚本（如有）。

## 🏃‍♂️ 运行服务

### 开发模式
```bash
go run main.go
```
服务将在 `http://localhost:8080`（或你配置的端口）启动。

### 生产模式
构建可执行文件：
```bash
go build -o devlog-server main.go
./devlog-server
```

## ⚙️ 配置参考

| 分类 | 变量名 | 说明 |
|------|--------|------|
| **数据库** | `DB_HOST` | 数据库主机地址（如：localhost） |
| | `DB_PORT` | 数据库端口（默认：5432） |
| | `DB_USER` | 数据库用户名 |
| | `DB_PASSWORD` | 数据库密码 |
| | `DB_NAME` | 数据库名称 |
| **服务器** | `SERVER_PORT` | 监听端口（默认：8080） |
| | `GIN_MODE` | 运行模式：`debug` 或 `release` |
| | `JWT_SECRET` | 用于签发 Token 的密钥 |
| **SSL** | `SERVER_SSL` | 是否启用 SSL：`true` 或 `false` |
| | `SERVER_JKS_PATH` | JKS 证书文件路径 |
| **AI** | `AI_PROVIDER` | AI 提供商：`openai`, `gemini`, `ollama`, `dashscope` |
| | `AI_API_KEY` | AI 服务 API Key |
| | `AI_MODEL` | 模型名称（如：`qwen-turbo`） |
| **存储** | `OSS_ENDPOINT` | 阿里云 OSS 节点地址 |
| | `OSS_ACCESS_KEY_ID` | OSS Access Key ID |
| **SEO** | `SEO_SITE_URL` | 站点公开 URL |
| | `SEO_PUSH_INTERVAL` | URL 推送间隔（如：`24h`） |

## 📚 API 文档

API 使用 Swagger 进行文档化。

- **Swagger UI：** `http://localhost:8080/swagger/index.html`（服务运行时）
- **API 参考：** 查看 [API.md](./API.md) 获取 Markdown 格式的快速参考。

### 主要接口
- `POST /api/v1/auth/login` - 管理员登录
- `GET /api/v1/posts` - 获取文章列表
- `GET /api/v1/posts/:id` - 获取文章详情
- `POST /api/v1/posts/:id/comments` - 添加评论

## 📂 项目结构

```
backend/
├── cmd/                # 命令行工具（如：genhash 密码生成）
├── config/             # 配置加载逻辑
├── database/           # 数据库连接与初始化
├── docs/               # Swagger 文档文件
├── internal/           # 私有应用代码
│   ├── api/            # HTTP 处理器与路由
│   ├── model/          # 数据模型
│   ├── repository/     # 数据访问层
│   ├── service/        # 业务逻辑层
│   └── middleware/     # Gin 中间件
├── pkg/                # 公共库（如：工具函数）
├── JKS/                # SSL 证书文件 (Java KeyStore)
├── API.md              # Markdown 格式 API 文档
├── DATABASE_SETUP.md   # 数据库配置指南
├── main.go             # 应用入口
└── .env                # 环境配置文件
```

## 🤝 贡献指南

1. Fork 本项目
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

基于 MIT 许可证分发。详见 `LICENSE` 文件。
