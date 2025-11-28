package dto

// ========== Request DTOs ==========

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// ========== Response DTOs ==========

type LoginResponse struct {
	Token     string        `json:"token"`
	ExpiresAt int64         `json:"expiresAt"`
	User      AdminResponse `json:"user"`
}

type AdminResponse struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email,omitempty"`
}
