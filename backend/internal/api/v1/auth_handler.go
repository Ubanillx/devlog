package v1

import (
	"backend/internal/model/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login godoc
// @Summary Admin login
// @Tags auth
// @Param credentials body dto.LoginRequest true "Login credentials"
// @Success 200 {object} dto.APIResponse{data=dto.LoginResponse}
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	response, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.Error(401, "Invalid credentials"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}

// GetCurrentUser godoc
// @Summary Get current logged in user
// @Tags auth
// @Security BearerAuth
// @Success 200 {object} dto.APIResponse{data=dto.AdminResponse}
// @Router /auth/me [get]
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	adminID, exists := c.Get("adminID")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Error(401, "Not authenticated"))
		return
	}

	uid, ok := adminID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Invalid admin ID"))
		return
	}

	response, err := h.authService.GetAdminByID(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to get user info"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}
