# DevLog Frontend

DevLog Frontend is a modern, responsive, and interactive blog user interface built with React, TypeScript, and Vite. It features a developer-centric "terminal" aesthetic, markdown rendering, and a comprehensive admin dashboard for content management.

## 🚀 Tech Stack

- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/) (implied by class names in App.tsx)
- **Markdown:** `markdown-it`, `react-markdown-editor-lite`
- **API Client:** `fetch` with generated TypeScript bindings (`openapi-typescript-codegen`)
- **Icons:** SVG Icons

## ✨ Features

- **UI/UX:**
  - 🖥️ **Terminal Style Hero:** Interactive landing section simulating a developer terminal.
  - 🌗 **Theme System:** Dark/Light mode toggle with persistent state.
  - 📱 **Responsive Design:** Mobile-friendly navigation and layout.
  - 🎨 **Background Effects:** Dynamic background canvas animation.

- **Blog Functionality:**
  - **Post Listing:** "ls -lat" style post listing.
  - **Markdown Support:** Full markdown rendering with code highlighting (`highlight.js`).
  - **Reading Mode:** Distraction-free article reading experience.
  - **Tags & Categories:** Organized content.

- **Admin Dashboard:**
  - **Secure Login:** JWT-based authentication.
  - **Content Management:** Create, Edit, Delete, and Publish/Unpublish posts.
  - **Markdown Editor:** Integrated WYSIWYG markdown editor.

- **Integration:**
  - **RSS Feed:** Automated RSS feed generation script.
  - **API Integration:** Strongly typed API client generated from Swagger.

## 🛠️ Prerequisites

- Node.js 18+
- npm or yarn

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devlog/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Create development environment file:
     ```bash
     cp .env.development.example .env.development
     ```
   - Edit `.env.development` if needed (default API URL is `http://localhost:8080/api/v1`).

4. **API Client Generation (Optional)**
   - If the backend API changes, regenerate the client:
     ```bash
     npm run gen:api
     ```
   - *Note: Requires the backend server to be running and serving Swagger docs.*

## 🏃‍♂️ Running the App

### Development Mode
Start the development server with hot reload:
```bash
npm run dev
```
Access the app at `http://localhost:3000`.

### Production Build
Build the application for production:
```bash
npm run build
```
This will generate static files in the `dist` directory.

### Preview Production Build
Preview the built application locally:
```bash
npm run preview
```

## ⚙️ Configuration

### Environment Variables

| File | Variable | Description |
|------|----------|-------------|
| `.env.development` | `VITE_API_BASE_URL` | API endpoint for development (e.g., `http://localhost:8080/api/v1`) |
| `.env.production` | `VITE_API_BASE_URL` | API endpoint for production |

### Site Configuration
Global site settings (social links, footer, etc.) can be found in `src/config/index.ts` (or `siteConfig.json`).

## 📂 Project Structure

```
web/
├── api-client/         # Generated API client code
├── components/         # React UI components
│   ├── TerminalHero.tsx    # Hero section
│   ├── PostCard.tsx        # Blog post item
│   ├── AdminDashboard.tsx  # Admin interface
│   └── ...
├── config/             # Site configuration
├── public/             # Static assets (favicon, etc.)
├── scripts/            # Utility scripts (RSS generation)
├── App.tsx             # Main application component & routing
├── index.tsx           # Entry point
├── tailwind.config.js  # Tailwind configuration (implied)
└── vite.config.ts      # Vite configuration
```

## 📝 RSS Feed

To generate the RSS feed based on your posts:
```bash
npm run feed
```
This script fetches posts from the API and generates an `rss.xml` file in the `public` directory.

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewLook`)
3. Commit your Changes (`git commit -m 'Add some NewLook'`)
4. Push to the Branch (`git push origin feature/NewLook`)
5. Open a Pull Request
