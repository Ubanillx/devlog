package api

import (
	"backend/internal/api/middleware"
	v1 "backend/internal/api/v1"
	"backend/internal/repository"
	"backend/internal/service"
	"log"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

type Router struct {
	engine *gin.Engine
}

func NewRouter(db *gorm.DB) *Router {
	engine := gin.Default()

	// Global Middleware
	engine.Use(middleware.CORSMiddleware())

	// Initialize Repositories
	postRepo := repository.NewPostRepository(db)
	tagRepo := repository.NewTagRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	adminRepo := repository.NewAdminRepository(db)

	// Initialize Services
	postService := service.NewPostService(postRepo, tagRepo)
	tagService := service.NewTagService(tagRepo)
	commentService := service.NewCommentService(commentRepo, postRepo)
	authService := service.NewAuthService(adminRepo)

	// Initialize AI Service (optional, won't crash if not configured)
	aiService, err := service.NewAIServiceFromEnv()
	var aiHandler *v1.AIHandler
	if err != nil {
		log.Printf("AI service not available: %v", err)
	} else {
		aiHandler = v1.NewAIHandler(aiService)
	}

	// Initialize OSS Service (optional)
	ossService, err := service.NewOSSServiceFromEnv()
	var uploadHandler *v1.UploadHandler
	if err != nil {
		log.Printf("OSS service not available: %v", err)
	} else {
		uploadHandler = v1.NewUploadHandler(ossService)
	}

	// Initialize Handlers
	postHandler := v1.NewPostHandler(postService)
	tagHandler := v1.NewTagHandler(tagService)
	commentHandler := v1.NewCommentHandler(commentService)
	authHandler := v1.NewAuthHandler(authService)

	// API v1 Routes
	apiV1 := engine.Group("/api/v1")
	{
		// Public Routes
		// Posts
		apiV1.GET("/posts", postHandler.GetPosts)
		apiV1.GET("/posts/:id", postHandler.GetPostByID)

		// Tags
		apiV1.GET("/tags", tagHandler.GetTags)

		// Comments
		apiV1.GET("/posts/:id/comments", commentHandler.GetComments)
		apiV1.POST("/posts/:id/comments", commentHandler.CreateComment)
		apiV1.POST("/comments/:id/guest-reply", commentHandler.GuestReplyComment)

		// Auth
		apiV1.POST("/auth/login", authHandler.Login)

		// Protected Routes (Admin)
		admin := apiV1.Group("")
		admin.Use(middleware.AuthMiddleware(authService))
		{
			// Auth
			admin.GET("/auth/me", authHandler.GetCurrentUser)

			// Posts (Admin)
			admin.GET("/admin/posts", postHandler.GetAllPosts)
			admin.POST("/posts", postHandler.CreatePost)
			admin.PUT("/posts/:id", postHandler.UpdatePost)
			admin.DELETE("/posts/:id", postHandler.DeletePost)

			// Tags (Admin)
			admin.POST("/tags", tagHandler.CreateTag)
			admin.DELETE("/tags/:id", tagHandler.DeleteTag)

			// Comments (Admin)
			admin.GET("/admin/comments", commentHandler.GetAllComments)
			admin.POST("/comments/:id/reply", commentHandler.ReplyComment)
			admin.DELETE("/comments/:id", commentHandler.DeleteComment)

			// AI (Admin) - only if AI service is available
			if aiHandler != nil {
				admin.POST("/ai/excerpt", aiHandler.GenerateExcerpt)
				admin.POST("/ai/readtime", aiHandler.GenerateReadTime)
				admin.POST("/ai/tags", aiHandler.GenerateTags)
				admin.POST("/ai/summarize", aiHandler.SummarizePost)
			}

			// Upload (Admin) - only if OSS service is available
			if uploadHandler != nil {
				admin.POST("/upload", uploadHandler.UploadFile)
			}
		}

		// AI Chat (Public - rate limited in production)
		if aiHandler != nil {
			apiV1.POST("/ai/chat", aiHandler.Chat)
			apiV1.POST("/ai/chat/stream", aiHandler.ChatStream)
		}
	}

	// Health Check
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Swagger Documentation
	engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return &Router{engine: engine}
}

func (r *Router) Run(addr string) error {
	return r.engine.Run(addr)
}

func (r *Router) Engine() *gin.Engine {
	return r.engine
}
