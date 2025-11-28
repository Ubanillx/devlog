package entity

import (
	"time"

	"github.com/google/uuid"
)

type Admin struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Username     string     `gorm:"size:50;not null;unique" json:"username"`
	PasswordHash string     `gorm:"size:255;not null" json:"-"`
	Email        *string    `gorm:"size:255;unique" json:"email,omitempty"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"created_at"`
	LastLogin    *time.Time `json:"last_login,omitempty"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
}

func (Admin) TableName() string {
	return "admins"
}
