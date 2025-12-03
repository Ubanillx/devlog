# DevLog

A modern, full-stack personal developer blog platform featuring terminal-style UI, AI-powered content summarization & Q&A, Markdown editing, and SEO optimization.

一个现代化的全栈个人开发者博客平台，采用终端风格设计，支持 AI 内容总结与问答、Markdown 编辑、SEO 优化等功能。

![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-008ECF?style=flat-square&logo=gin&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![Alibaba Cloud](https://img.shields.io/badge/Alibaba_Cloud-FF6A00?style=flat-square&logo=alibabacloud&logoColor=white)

# Demo / 展示

### Homepage / 主页
Terminal-style homepage with `whoami` intro and post listing.

终端风格主页，展示作者介绍和文章列表。

![Homepage](./assets/image-20251203091554080.png)

### Article Page / 文章页面
Markdown rendering with AI-generated summary, tags, and reading time.

文章详情页，支持 Markdown 渲染、AI 摘要、标签和阅读时间。

![Article Page](./assets/image-20251203091744919.png)

### AI Chat & Summary / AI 对话与总结
Context-aware Q&A based on article content.

基于文章内容的智能问答，AI 根据文章回答用户问题。

![AI Chat](./assets/image-20251203091900947.png)

### About Page / 个人页面
Developer profile with tech stack, experience timeline, and contact info.

开发者简介页，展示技术栈、工作经历和联系方式。

![About Page](./assets/image-20251203091933755.png)

### Light Mode / 浅色模式
Full theme toggle support with preference memory.

支持深色/浅色主题切换，自动记忆用户偏好。

![Light Mode](./assets/image-20251203091946729.png)

### Post Editor / 文章编辑
Markdown editor with toolbar, tag suggestions, and live preview.

后台文章编辑器，支持 Markdown 工具栏、标签建议和实时预览。

![Post Editor](./assets/image-20251203092531352.png)

### System Settings / 系统设置
JSON-based site configuration for easy customization.

通过 JSON 配置站点信息和个人资料，无需修改代码。

![System Settings](./assets/image-20251203092540317.png)

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
| **Docker Deploy** | [DOCKER.md](./DOCKER.md) | - |

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

### 🎨 UI & Theme / 界面与主题
- **Dark/Light Mode / 深色浅色模式** - Toggle with preference memory / 一键切换，自动记忆
- **Terminal Style / 终端风格** - Unique developer aesthetic / 独特的开发者美学

### 📝 Content Management / 内容管理
- **Markdown Editor / Markdown 编辑器** - Live preview with syntax highlighting / 实时预览，代码高亮
- **Tag System / 标签系统** - Flexible post categorization / 灵活的文章分类
- **Draft/Publish / 草稿发布** - Complete publishing workflow / 完整的发布工作流
- **File Upload / 文件上传** - Upload images to Alibaba Cloud OSS / 上传至阿里云 OSS

### 🤖 AI Features / AI 能力
- **AI Metadata / AI 元信息** - Auto-generate excerpt & tag suggestions / 自动生成摘要、标签建议
- **AI Summary / AI 总结** - One-click content summarization / 一键生成内容摘要
- **AI Q&A / AI 问答** - Context-aware Q&A based on post content / 基于文章的智能问答
- **Multi-Model / 多模型** - OpenAI / Gemini / Ollama / Qwen

### 💬 Interaction / 互动功能
- **Comments / 评论系统** - Public comments with admin replies / 访客评论，管理员回复
- **Moderation / 评论审核** - Soft delete & content management / 软删除与内容管理

### ⚙️ Configuration / 配置化
- **JSON Profile / JSON 配置** - Edit personal info via JSON, no code changes / 通过 JSON 配置个人信息
- **Environment Variables / 环境变量** - Flexible deployment config / 灵活的部署配置

### 🔧 DevOps / 开发运维
- **Docker Compose** - One-click deploy frontend + backend + database / 一键部署
- **SEO Tools / SEO 工具** - Auto URL push to Baidu/Bing / 自动推送 URL
- **RSS Feed / RSS 订阅** - Auto-generated RSS / 自动生成
- **Swagger Docs / API 文档** - Complete API documentation / 完整的接口文档

## 📄 License / 许可证

MIT License
