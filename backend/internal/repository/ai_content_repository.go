package repository

import (
	"backend/internal/model/entity"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AIContentRepository interface {
	FindLatestSuccessfulSummary(postID uuid.UUID) (*entity.AIGeneratedContent, error)
	CreateSummarySuccess(postID uuid.UUID, summary string, model string) error
	CreateSummaryFailure(postID uuid.UUID, model string, errorMessage string) error
}

type aiContentRepository struct {
	db *gorm.DB
}

func NewAIContentRepository(db *gorm.DB) AIContentRepository {
	return &aiContentRepository{db: db}
}

func (r *aiContentRepository) FindLatestSuccessfulSummary(postID uuid.UUID) (*entity.AIGeneratedContent, error) {
	var content entity.AIGeneratedContent
	err := r.db.
		Where("post_id = ? AND status IN ? AND generated_summary IS NOT NULL AND TRIM(generated_summary) <> ''", postID, []string{"success", "applied"}).
		Order("created_at DESC").
		First(&content).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &content, nil
}

func (r *aiContentRepository) CreateSummarySuccess(postID uuid.UUID, summary string, model string) error {
	record := &entity.AIGeneratedContent{
		PostID:           postID,
		GeneratedSummary: summary,
		AIModel:          model,
		Status:           "success",
	}
	return r.db.Create(record).Error
}

func (r *aiContentRepository) CreateSummaryFailure(postID uuid.UUID, model string, errorMessage string) error {
	record := &entity.AIGeneratedContent{
		PostID:       postID,
		AIModel:      model,
		Status:       "failed",
		ErrorMessage: errorMessage,
	}
	return r.db.Create(record).Error
}
