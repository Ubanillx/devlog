package entity

import (
	"time"

	"github.com/google/uuid"
)

type Tag struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"size:50;not null;unique" json:"name"`
	Slug      string    `gorm:"size:50;not null;unique" json:"slug"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UseCount  int       `gorm:"default:0" json:"use_count"`
}

func (Tag) TableName() string {
	return "tags"
}
