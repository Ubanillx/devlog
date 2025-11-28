package repository

import (
	"backend/internal/model/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostRepository interface {
	FindAll(page, pageSize int, tag, search, status string) ([]entity.BlogPost, int64, error)
	FindByID(id uuid.UUID) (*entity.BlogPost, error)
	Create(post *entity.BlogPost) error
	Update(post *entity.BlogPost) error
	Delete(id uuid.UUID) error
	IncrementViewCount(id uuid.UUID) error
}

type postRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) FindAll(page, pageSize int, tag, search, status string) ([]entity.BlogPost, int64, error) {
	var posts []entity.BlogPost
	var total int64

	query := r.db.Model(&entity.BlogPost{}).Preload("Tags")

	// Filter by status
	switch status {
	case "published":
		query = query.Where("is_published = ?", true)
	case "draft":
		query = query.Where("is_published = ?", false)
		// "all" - no filter
	}

	// Filter by tag
	if tag != "" {
		query = query.Joins("JOIN post_tags ON post_tags.post_id = blog_posts.id").
			Joins("JOIN tags ON tags.id = post_tags.tag_id").
			Where("tags.slug = ? OR tags.name = ?", tag, tag)
	}

	// Search in title and excerpt
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("title ILIKE ? OR excerpt ILIKE ?", searchPattern, searchPattern)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Paginate and order
	offset := (page - 1) * pageSize
	if err := query.Order("published_date DESC, created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *postRepository) FindByID(id uuid.UUID) (*entity.BlogPost, error) {
	var post entity.BlogPost
	if err := r.db.Preload("Tags").Preload("Author").First(&post, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *postRepository) Create(post *entity.BlogPost) error {
	return r.db.Create(post).Error
}

func (r *postRepository) Update(post *entity.BlogPost) error {
	return r.db.Save(post).Error
}

func (r *postRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entity.BlogPost{}, "id = ?", id).Error
}

func (r *postRepository) IncrementViewCount(id uuid.UUID) error {
	return r.db.Model(&entity.BlogPost{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}
