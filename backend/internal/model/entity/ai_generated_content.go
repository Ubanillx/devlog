package entity

import (
	"time"

	"github.com/google/uuid"
)

type AIGeneratedContent struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PostID            uuid.UUID  `gorm:"type:uuid;not null;index" json:"post_id"`
	GeneratedExcerpt  string     `gorm:"type:text" json:"generated_excerpt,omitempty"`
	GeneratedSummary  string     `gorm:"type:text" json:"generated_summary,omitempty"`
	GeneratedReadTime string     `gorm:"size:20" json:"generated_read_time,omitempty"`
	AIModel           string     `gorm:"size:100" json:"ai_model,omitempty"`
	PromptTokens      int        `gorm:"default:0" json:"prompt_tokens"`
	CompletionTokens  int        `gorm:"default:0" json:"completion_tokens"`
	Status            string     `gorm:"size:20;not null;default:'pending'" json:"status"`
	IsApplied         bool       `gorm:"default:false" json:"is_applied"`
	CreatedAt         time.Time  `gorm:"autoCreateTime" json:"created_at"`
	AppliedAt         *time.Time `json:"applied_at,omitempty"`
	ErrorMessage      string     `gorm:"type:text" json:"error_message,omitempty"`
}

func (AIGeneratedContent) TableName() string {
	return "ai_generated_content"
}
