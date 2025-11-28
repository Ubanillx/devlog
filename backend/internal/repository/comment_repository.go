package repository

import (
	"backend/internal/model/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentRepository interface {
	FindByPostID(postID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error)
	FindByID(id uuid.UUID) (*entity.Comment, error)
	FindReplies(parentID uuid.UUID) ([]entity.Comment, error)
	Create(comment *entity.Comment) error
	Update(comment *entity.Comment) error
	SoftDelete(id uuid.UUID) error
	GetAllForAdmin(page, pageSize int) ([]entity.Comment, int64, error)
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) FindByPostID(postID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error) {
	var comments []entity.Comment
	var total int64

	query := r.db.Model(&entity.Comment{}).
		Where("post_id = ? AND parent_id IS NULL AND is_deleted = ?", postID, false)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Preload("Replies", "is_deleted = ?", false).
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&comments).Error; err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *commentRepository) FindByID(id uuid.UUID) (*entity.Comment, error) {
	var comment entity.Comment
	if err := r.db.First(&comment, "id = ? AND is_deleted = ?", id, false).Error; err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *commentRepository) FindReplies(parentID uuid.UUID) ([]entity.Comment, error) {
	var replies []entity.Comment
	if err := r.db.Where("parent_id = ? AND is_deleted = ?", parentID, false).
		Order("created_at ASC").Find(&replies).Error; err != nil {
		return nil, err
	}
	return replies, nil
}

func (r *commentRepository) Create(comment *entity.Comment) error {
	return r.db.Create(comment).Error
}

func (r *commentRepository) Update(comment *entity.Comment) error {
	return r.db.Save(comment).Error
}

func (r *commentRepository) SoftDelete(id uuid.UUID) error {
	return r.db.Model(&entity.Comment{}).Where("id = ?", id).
		Update("is_deleted", true).Error
}

func (r *commentRepository) GetAllForAdmin(page, pageSize int) ([]entity.Comment, int64, error) {
	var comments []entity.Comment
	var total int64

	query := r.db.Model(&entity.Comment{}).Where("is_deleted = ?", false)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&comments).Error; err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}
