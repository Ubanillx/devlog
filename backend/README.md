# DevLog Backend

DevLog is a personal developer blog backend API built with Go (Golang). It provides a robust RESTful API for managing blog posts, comments, tags, and integrates with AI services for enhanced functionality.

## 🚀 Tech Stack

- **Language:** [Go 1.25](https://go.dev/)
- **Web Framework:** [Gin](https://github.com/gin-gonic/gin)
- **Database ORM:** [GORM](https://gorm.io/)
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **API Documentation:** [Swagger](https://github.com/swaggo/swag)
- **AI Integration:** [LangChainGo](https://github.com/tmc/langchaingo)
- **Object Storage:** Alibaba Cloud OSS

## ✨ Features

- **Article Management:**
  - CRUD operations for blog posts
  - Markdown content support
  - Tagging system
  - Publish/Draft status
  - Full-text search (title/excerpt)

- **Comment System:**
  - Public comments
  - Admin replies
  - Moderation tools (soft delete)

- **Authentication & Security:**
  - Admin login with JWT
  - Protected routes for content management
  - SSL/TLS support (JKS)

- **AI Capabilities:**
  - Integration with multiple AI providers (OpenAI, Gemini, Ollama, Dashscope/Qwen)
  - AI-assisted features (e.g., summarization, chat)

- **SEO & Analytics:**
  - Automated URL submission to Baidu and Bing
  - SEO-friendly URL structure

- **System:**
  - Health check endpoint
  - Graceful shutdown
  - Docker-ready (implied)

## 🛠️ Prerequisites

- Go 1.25+
- PostgreSQL 12+
- Git

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devlog/backend
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Database Setup**
   - Create a PostgreSQL database named `devlog`.
   - The application uses GORM auto-migration, but you can find the schema in `schema.sql` and setup guide in `DATABASE_SETUP.md`.

4. **Configuration**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your configuration:
     - Database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.)
     - Server settings (`SERVER_PORT`, `GIN_MODE`)
     - AI Provider settings (optional)
     - OSS and SEO configurations (optional)

5. **Generate Admin Password**
   - Use the included utility to generate a hashed password for the database:
     ```bash
     go run cmd/genhash/main.go -password "your-admin-password"
     ```
   - Insert the admin user into the database manually or via seed script (if available).

## 🏃‍♂️ Running the Server

### Development Mode
```bash
go run main.go
```
The server will start at `http://localhost:8080` (or your configured port).

### Production Mode
Build the binary:
```bash
go build -o devlog-server main.go
./devlog-server
```

## ⚙️ Configuration Reference

| Category | Variable | Description |
|----------|----------|-------------|
| **Database** | `DB_HOST` | Database host (e.g., localhost) |
| | `DB_PORT` | Database port (default: 5432) |
| | `DB_USER` | Database username |
| | `DB_PASSWORD` | Database password |
| | `DB_NAME` | Database name |
| **Server** | `SERVER_PORT` | Port to listen on (default: 8080) |
| | `GIN_MODE` | `debug` or `release` |
| | `JWT_SECRET` | Secret key for signing tokens |
| **SSL** | `SERVER_SSL` | Enable SSL `true` or `false` |
| | `SERVER_JKS_PATH` | Path to JKS keystore |
| **AI** | `AI_PROVIDER` | `openai`, `gemini`, `ollama`, `dashscope` |
| | `AI_API_KEY` | API Key for the provider |
| | `AI_MODEL` | Specific model name (e.g., `qwen-turbo`) |
| **Storage** | `OSS_ENDPOINT` | Alibaba Cloud OSS Endpoint |
| | `OSS_ACCESS_KEY_ID` | OSS Access Key ID |
| **SEO** | `SEO_SITE_URL` | Your site's public URL |
| | `SEO_PUSH_INTERVAL` | Interval for SEO push (e.g., `24h`) |

## 📚 API Documentation

The API is documented using Swagger.

- **Swagger UI:** `http://localhost:8080/swagger/index.html` (when running)
- **API Reference:** See [API.md](./API.md) for a quick markdown reference.

### Key Endpoints
- `POST /api/v1/auth/login` - Admin Login
- `GET /api/v1/posts` - List Posts
- `GET /api/v1/posts/:id` - Get Post Details
- `POST /api/v1/posts/:id/comments` - Add Comment

## 📂 Project Structure

```
backend/
├── cmd/                # Command-line utilities (e.g., genhash)
├── config/             # Configuration loading logic
├── database/           # Database connection and setup
├── docs/               # Swagger documentation files
├── internal/           # Private application code
│   ├── api/            # HTTP handlers and router
│   ├── model/          # Data models
│   ├── repository/     # Data access layer
│   ├── service/        # Business logic
│   └── middleware/     # Gin middlewares
├── pkg/                # Public libraries (e.g., utils)
├── JKS/                # Java KeyStore files for SSL
├── API.md              # Markdown API documentation
├── DATABASE_SETUP.md   # Database setup guide
├── main.go             # Application entry point
└── .env                # Environment configuration
```

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
