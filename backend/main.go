// @title           DevLog API
// @version         1.0
// @description     Personal Developer Blog Backend API
// @termsOfService  http://swagger.io/terms/

// @contact.name   DevLog Support
// @contact.email  admin@devlog.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

package main

import (
	"context"
	"crypto/tls"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"

	"backend/config"
	"backend/database"
	"backend/internal/api"
	"backend/internal/repository"
	"backend/internal/service"
	"backend/pkg/tlsutil"

	_ "backend/docs" // swagger docs
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	if err := database.Connect(cfg.Database.DSN()); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Initialize Router with all API endpoints
	router := api.NewRouter(database.DB)

	// Start SEO service (URL pushing to search engines)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	postRepo := repository.NewPostRepository(database.DB)
	seoService := service.NewSEOService(cfg.SEO, postRepo)
	go seoService.Start(ctx)

	// Graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Shutting down server...")
		cancel()
	}()

	log.Printf("Server starting on port %s", cfg.Server.Port)

	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router.Engine(),
	}

	if cfg.Server.SSL {
		log.Printf("Enabling SSL with JKS file: %s", cfg.Server.JKSPath)
		tlsCert, err := tlsutil.LoadTLSCertFromJKS(cfg.Server.JKSPath, cfg.Server.JKSPassword)
		if err != nil {
			log.Fatalf("Failed to load JKS certificate: %v", err)
		}

		srv.TLSConfig = &tls.Config{
			Certificates: []tls.Certificate{tlsCert},
		}

		if err := srv.ListenAndServeTLS("", ""); err != nil {
			log.Fatalf("Failed to start SSL server: %v", err)
		}
	} else {
		if err := srv.ListenAndServe(); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}
}
