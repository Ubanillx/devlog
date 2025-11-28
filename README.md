# DevLog

A modern, full-stack personal developer blog platform with a terminal-style aesthetic.

一个现代化的全栈个人开发者博客平台，采用终端风格设计。

## 🏗️ Architecture / 架构

```
devlog/
├── backend/    # Go + Gin + PostgreSQL
└── web/        # React + TypeScript + Vite
```

## 📖 Documentation / 文档

| Module | English | 中文 |
|--------|---------|------|
| **Backend** | [README](./backend/README.md) | [中文文档](./backend/README_ZH.md) |
| **Frontend** | [README](./web/README.md) | [中文文档](./web/README_ZH.md) |
| **API Reference** | [API.md](./backend/API.md) | - |
| **Database Setup** | [DATABASE_SETUP.md](./backend/DATABASE_SETUP.md) | - |

## 🚀 Quick Start / 快速开始

### Prerequisites / 环境要求
- Go 1.25+
- Node.js 18+
- PostgreSQL 12+

### 1. Start Backend / 启动后端
```bash
cd backend
cp .env.example .env
# Edit .env with your config
go run main.go
```

### 2. Start Frontend / 启动前端
```bash
cd web
cp .env.development.example .env.development
npm install
npm run dev
```

### 3. Access / 访问
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api/v1
- **Swagger Docs:** http://localhost:8080/swagger/index.html

## ✨ Features / 功能特性

- 📝 **Blog Management** - Markdown posts with tags
- 💬 **Comment System** - Public comments with admin replies
- 🤖 **AI Integration** - OpenAI / Gemini / Qwen support
- 🔐 **Admin Dashboard** - Secure content management
- 🌗 **Theme Toggle** - Dark/Light mode
- 📡 **SEO Tools** - Auto URL push to Baidu/Bing
- 📰 **RSS Feed** - Auto-generated RSS

## 📄 License / 许可证

MIT License
