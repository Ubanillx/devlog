package entity

import (
	"time"

	"github.com/google/uuid"
)

type Comment struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PostID    *uuid.UUID `gorm:"type:uuid" json:"post_id,omitempty"`
	ParentID  *uuid.UUID `gorm:"type:uuid" json:"parent_id,omitempty"`
	Author    string     `gorm:"size:100;not null" json:"author"`
	Content   string     `gorm:"type:text;not null" json:"content"`
	Role      string     `gorm:"size:10;not null;default:'guest'" json:"role"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	IsDeleted bool       `gorm:"default:false" json:"is_deleted"`

	// Relations
	Post    *BlogPost `gorm:"foreignKey:PostID" json:"post,omitempty"`
	Parent  *Comment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies []Comment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
}

func (Comment) TableName() string {
	return "comments"
}
