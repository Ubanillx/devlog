# DevLog 前端

DevLog 前端是一个使用 React、TypeScript 和 Vite 构建的现代化、响应式博客用户界面。它采用开发者风格的"终端"美学设计，支持 Markdown 渲染，并提供完整的管理后台进行内容管理。

## 🚀 技术栈

- **核心框架：** [React 19](https://react.dev/)、[TypeScript](https://www.typescriptlang.org/)
- **构建工具：** [Vite 6](https://vitejs.dev/)
- **样式方案：** [TailwindCSS](https://tailwindcss.com/)
- **Markdown：** `markdown-it`、`react-markdown-editor-lite`
- **API 客户端：** 使用 `openapi-typescript-codegen` 生成的强类型 TypeScript 绑定
- **图标：** SVG 图标

## ✨ 功能特性

- **UI/UX 设计：**
  - 🖥️ **终端风格首页：** 模拟开发者终端的交互式着陆区域
  - 🌗 **主题系统：** 深色/浅色模式切换，状态持久化
  - 📱 **响应式设计：** 适配移动端的导航和布局
  - 🎨 **背景特效：** 动态背景画布动画

- **博客功能：**
  - **文章列表：** "ls -lat" 风格的文章展示
  - **Markdown 支持：** 完整的 Markdown 渲染，配合代码高亮 (`highlight.js`)
  - **阅读模式：** 无干扰的文章阅读体验
  - **标签与分类：** 有序的内容组织

- **管理后台：**
  - **安全登录：** 基于 JWT 的身份认证
  - **内容管理：** 创建、编辑、删除、发布/取消发布文章
  - **Markdown 编辑器：** 集成所见即所得 Markdown 编辑器

- **集成功能：**
  - **RSS 订阅：** 自动生成 RSS 订阅源脚本
  - **API 集成：** 从 Swagger 生成的强类型 API 客户端

## 🛠️ 环境要求

- Node.js 18+
- npm 或 yarn

## 📦 安装与配置

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd devlog/web
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境变量配置**
   - 创建开发环境配置文件：
     ```bash
     cp .env.development.example .env.development
     ```
   - 根据需要编辑 `.env.development`（默认 API 地址为 `http://localhost:8080/api/v1`）。

4. **API 客户端生成（可选）**
   - 如果后端 API 发生变化，重新生成客户端代码：
     ```bash
     npm run gen:api
     ```
   - *注意：需要后端服务运行并提供 Swagger 文档。*

## 🏃‍♂️ 运行应用

### 开发模式
启动带热更新的开发服务器：
```bash
npm run dev
```
访问 `http://localhost:3000` 查看应用。

### 生产构建
构建生产版本：
```bash
npm run build
```
静态文件将生成在 `dist` 目录中。

### 预览生产构建
本地预览构建后的应用：
```bash
npm run preview
```

## ⚙️ 配置说明

### 环境变量

| 文件 | 变量名 | 说明 |
|------|--------|------|
| `.env.development` | `VITE_API_BASE_URL` | 开发环境 API 地址（如：`http://localhost:8080/api/v1`） |
| `.env.production` | `VITE_API_BASE_URL` | 生产环境 API 地址 |

### 站点配置
全局站点设置（社交链接、页脚等）位于 `config/index.ts`（或 `siteConfig.json`）中。

## 📂 项目结构

```
web/
├── api-client/         # 生成的 API 客户端代码
├── components/         # React UI 组件
│   ├── TerminalHero.tsx    # 首页终端区域
│   ├── PostCard.tsx        # 博客文章卡片
│   ├── AdminDashboard.tsx  # 管理后台界面
│   └── ...
├── config/             # 站点配置
├── public/             # 静态资源（favicon 等）
├── scripts/            # 工具脚本（RSS 生成）
├── App.tsx             # 主应用组件与路由
├── index.tsx           # 应用入口
└── vite.config.ts      # Vite 配置
```

## 📝 RSS 订阅源

根据文章生成 RSS 订阅源：
```bash
npm run feed
```
此脚本从 API 获取文章并在 `public` 目录生成 `rss.xml` 文件。

## 🤝 贡献指南

1. Fork 本项目
2. 创建你的功能分支 (`git checkout -b feature/NewLook`)
3. 提交你的更改 (`git commit -m 'Add some NewLook'`)
4. 推送到分支 (`git push origin feature/NewLook`)
5. 提交 Pull Request
