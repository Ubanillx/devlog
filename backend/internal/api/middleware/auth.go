package middleware

import (
	"backend/internal/model/dto"
	"backend/internal/service"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, dto.Error(401, "Authorization header required"))
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, dto.Error(401, "Invalid authorization header format"))
			c.Abort()
			return
		}

		tokenString := parts[1]
		adminID, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, dto.Error(401, "Invalid or expired token"))
			c.Abort()
			return
		}

		// Get admin info and set in context
		admin, err := authService.GetAdminByID(*adminID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, dto.Error(401, "Admin not found"))
			c.Abort()
			return
		}

		c.Set("adminID", *adminID)
		c.Set("adminUsername", admin.Username)
		c.Next()
	}
}
