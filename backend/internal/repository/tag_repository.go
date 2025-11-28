package repository

import (
	"backend/internal/model/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TagRepository interface {
	FindAll() ([]entity.Tag, error)
	FindByID(id uuid.UUID) (*entity.Tag, error)
	FindBySlug(slug string) (*entity.Tag, error)
	FindByName(name string) (*entity.Tag, error)
	FindByNames(names []string) ([]entity.Tag, error)
	FindOrCreateBySlug(tag *entity.Tag) error
	Create(tag *entity.Tag) error
	Delete(id uuid.UUID) error
}

type tagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) FindAll() ([]entity.Tag, error) {
	var tags []entity.Tag
	if err := r.db.Order("use_count DESC, name ASC").Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

func (r *tagRepository) FindByID(id uuid.UUID) (*entity.Tag, error) {
	var tag entity.Tag
	if err := r.db.First(&tag, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) FindBySlug(slug string) (*entity.Tag, error) {
	var tag entity.Tag
	if err := r.db.First(&tag, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) FindByName(name string) (*entity.Tag, error) {
	var tag entity.Tag
	if err := r.db.First(&tag, "name = ?", name).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) FindByNames(names []string) ([]entity.Tag, error) {
	var tags []entity.Tag
	if err := r.db.Where("name IN ?", names).Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

func (r *tagRepository) Create(tag *entity.Tag) error {
	return r.db.Create(tag).Error
}

func (r *tagRepository) FindOrCreateBySlug(tag *entity.Tag) error {
	return r.db.Where("slug = ?", tag.Slug).FirstOrCreate(tag).Error
}

func (r *tagRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entity.Tag{}, "id = ?", id).Error
}
