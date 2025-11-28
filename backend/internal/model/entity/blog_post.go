package entity

import (
	"time"

	"github.com/google/uuid"
)

type BlogPost struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title         string     `gorm:"size:500;not null" json:"title"`
	Excerpt       string     `gorm:"type:text;not null" json:"excerpt"`
	Content       string     `gorm:"type:text;not null" json:"content"`
	ReadTime      string     `gorm:"size:20;not null;default:'1 min'" json:"read_time"`
	PublishedDate time.Time  `gorm:"type:date;not null;default:CURRENT_DATE" json:"published_date"`
	CreatedAt     time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	IsPublished   bool       `gorm:"default:false" json:"is_published"`
	ViewCount     int        `gorm:"default:0" json:"view_count"`
	AuthorID      *uuid.UUID `gorm:"type:uuid" json:"author_id,omitempty"`

	// Relations
	Author *Admin `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Tags   []Tag  `gorm:"many2many:post_tags;joinForeignKey:post_id;joinReferences:tag_id" json:"tags,omitempty"`
}

func (BlogPost) TableName() string {
	return "blog_posts"
}
