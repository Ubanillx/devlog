# DevLog Backend Project Standards

## 🏗️ 架构设计 (Architecture)

本项目采用 **Clean Architecture (整洁架构)** 的简化版，注重分层解耦与依赖倒置。

### 目录结构 (Directory Structure)

```text
backend/
├── cmd/
│   └── server/
│       └── main.go          # 程序入口，负责依赖注入和启动服务
├── config/                  # 配置加载逻辑 (Viper)
├── internal/                # 内部应用代码 (不对外暴露)
│   ├── api/                 # HTTP 接口层 (Gin Handlers)
│   │   ├── v1/              # API 版本控制
│   │   ├── middleware/      # 中间件 (Auth, CORS, Logger)
│   │   └── router.go        # 路由注册
│   ├── service/             # 业务逻辑层 (Business Logic)
│   ├── repository/          # 数据访问层 (Database Access)
│   └── model/               # 数据模型 (Structs)
│       ├── entity/          # 数据库实体 (对应数据库表)
│       └── dto/             # 数据传输对象 (Request/Response)
└── pkg/                     # 公共工具包 (可被外部引用)
    ├── database/            # 数据库连接初始化
    ├── logger/              # 日志工具
    └── utils/               # 通用工具函数
```

---

## 🧱 分层职责 (Layer Responsibilities)

### 1. Handler Layer (`internal/api`)
- **职责**: 
  - 解析 HTTP 请求 (Header, Body, Query Params)
  - 参数校验 (Validator)
  - 调用 Service 层方法
  - 格式化 HTTP 响应 (JSON, Error Codes)
- **原则**: 不包含任何复杂的业务逻辑或 SQL 操作。

### 2. Service Layer (`internal/service`)
- **职责**:
  - 核心业务逻辑实现
  - 事务管理 (Transaction Management)
  - 数据组装与转换
  - 调用 Repository 层
- **原则**: 纯 Go 代码，不应依赖 HTTP 框架（如 Gin Context）。

### 3. Repository Layer (`internal/repository`)
- **职责**:
  - 直接与数据库交互 (CRUD)
  - 执行 SQL 语句
- **原则**: 
  - 每次只处理单表或聚合根的操作。
  - 方法名应清晰对应数据库操作 (e.g., `FindByID`, `Create`, `UpdateStatus`)。

### 4. Model Layer (`internal/model`)
- **Entity**: 对应数据库表结构，包含 `gorm` 或 `sqlx` 标签。
- **DTO**: 定义前端请求参数结构 (`CreatePostRequest`) 和返回结构 (`PostResponse`)。

---

## 📏 代码规范 (Coding Standards)

### 1. 命名规范 (Naming Convention)
- **文件名**: 使用下划线 `snake_case.go` (e.g., `blog_post.go`, `user_service.go`).
- **接口名**: 包含方法名 + `er` 后缀，或清晰描述功能 (e.g., `PostRepository`, `AuthService`).
- **变量名**: 驼峰式 `camelCase`，缩写全大写 (e.g., `userID`, `xmlHTTPRequest`).
- **常量名**: 全大写下划线 `UPPER_CASE` (e.g., `MAX_RETRY_COUNT`).

### 2. 错误处理 (Error Handling)
- **不要忽略错误**: 必须处理每一个 `err`。
- **Service 层**: 返回标准 `error` 或自定义业务错误。
- **Handler 层**: 统一捕获错误并转换为 HTTP 状态码。
- **Panic**: 仅在程序启动失败（如数据库连不上）时使用，运行时严禁 panic。

### 3. 日志规范 (Logging)
- 使用结构化日志 (Structured Logging)。
- **Error**: 系统异常，需要人工介入。
- **Warn**: 预期外的业务情况（如登录失败）。
- **Info**: 关键流程节点（如服务启动、定时任务执行）。
- **Debug**: 详细调试信息（生产环境通常关闭）。

### 4. API 响应格式 (Response Format)
所有 API 统一返回 JSON 格式：

```json
{
  "code": 200,
  "message": "Success",
  "data": { ... },
  "error": null
}
```

---

## 🛠️ 技术栈 (Tech Stack)
- **Web Framework**: Gin
- **Database**: PostgreSQL
- **ORM/Driver**: GORM 或 sqlx (推荐 GORM v2)
- **Config**: Viper
- **Logger**: Zap
- **Migration**: Golang-migrate 或 GORM AutoMigrate

---

## 📝 开发流程 (Development Workflow)
1. 定义 **Model** (Entity/DTO)
2. 定义 **Repository Interface** 及其实现
3. 定义 **Service Interface** 及其实现
4. 编写 **Handler** 并注册路由
5. 编写 **Unit Test** (可选，但推荐)
