package repository

import (
	"backend/internal/model/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminRepository interface {
	FindByUsername(username string) (*entity.Admin, error)
	FindByID(id uuid.UUID) (*entity.Admin, error)
	UpdateLastLogin(id uuid.UUID) error
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) FindByUsername(username string) (*entity.Admin, error) {
	var admin entity.Admin
	if err := r.db.First(&admin, "username = ? AND is_active = ?", username, true).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepository) FindByID(id uuid.UUID) (*entity.Admin, error) {
	var admin entity.Admin
	if err := r.db.First(&admin, "id = ? AND is_active = ?", id, true).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepository) UpdateLastLogin(id uuid.UUID) error {
	return r.db.Model(&entity.Admin{}).Where("id = ?", id).
		UpdateColumn("last_login", gorm.Expr("CURRENT_TIMESTAMP")).Error
}
