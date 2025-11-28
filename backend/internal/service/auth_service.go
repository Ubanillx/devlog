package service

import (
	"backend/internal/model/dto"
	"backend/internal/repository"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("your-secret-key-change-in-production") // TODO: Move to config

type AuthService interface {
	Login(req dto.LoginRequest) (*dto.LoginResponse, error)
	ValidateToken(tokenString string) (*uuid.UUID, error)
	GetAdminByID(id uuid.UUID) (*dto.AdminResponse, error)
}

type authService struct {
	adminRepo repository.AdminRepository
}

func NewAuthService(adminRepo repository.AdminRepository) AuthService {
	return &authService{adminRepo: adminRepo}
}

type Claims struct {
	AdminID string `json:"admin_id"`
	jwt.RegisteredClaims
}

func (s *authService) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	admin, err := s.adminRepo.FindByUsername(req.Username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Update last login
	_ = s.adminRepo.UpdateLastLogin(admin.ID)

	// Generate JWT
	expiresAt := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		AdminID: admin.ID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "devlog",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	email := ""
	if admin.Email != nil {
		email = *admin.Email
	}

	return &dto.LoginResponse{
		Token:     tokenString,
		ExpiresAt: expiresAt.Unix(),
		User: dto.AdminResponse{
			ID:       admin.ID.String(),
			Username: admin.Username,
			Email:    email,
		},
	}, nil
}

func (s *authService) ValidateToken(tokenString string) (*uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, errors.New("invalid token")
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		adminID, err := uuid.Parse(claims.AdminID)
		if err != nil {
			return nil, errors.New("invalid token claims")
		}
		return &adminID, nil
	}

	return nil, errors.New("invalid token")
}

func (s *authService) GetAdminByID(id uuid.UUID) (*dto.AdminResponse, error) {
	admin, err := s.adminRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	email := ""
	if admin.Email != nil {
		email = *admin.Email
	}

	return &dto.AdminResponse{
		ID:       admin.ID.String(),
		Username: admin.Username,
		Email:    email,
	}, nil
}

// SetJWTSecret allows setting the JWT secret from config
func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}
