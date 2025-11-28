package service

import (
	"backend/internal/model/dto"
	"backend/internal/model/entity"
	"backend/internal/repository"
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"
)

type TagService interface {
	GetAllTags() (*dto.TagListResponse, error)
	CreateTag(req dto.CreateTagRequest) (*dto.TagResponse, error)
	DeleteTag(id string) error
}

type tagService struct {
	tagRepo repository.TagRepository
}

func NewTagService(tagRepo repository.TagRepository) TagService {
	return &tagService{tagRepo: tagRepo}
}

func (s *tagService) GetAllTags() (*dto.TagListResponse, error) {
	tags, err := s.tagRepo.FindAll()
	if err != nil {
		return nil, err
	}

	tagResponses := make([]dto.TagResponse, len(tags))
	for i, tag := range tags {
		tagResponses[i] = dto.TagResponse{
			ID:       tag.ID.String(),
			Name:     tag.Name,
			Slug:     tag.Slug,
			UseCount: tag.UseCount,
		}
	}

	return &dto.TagListResponse{Tags: tagResponses}, nil
}

func (s *tagService) CreateTag(req dto.CreateTagRequest) (*dto.TagResponse, error) {
	// Check if tag already exists
	existing, _ := s.tagRepo.FindByName(req.Name)
	if existing != nil {
		return nil, errors.New("tag already exists")
	}

	tag := &entity.Tag{
		Name: req.Name,
		Slug: s.slugify(req.Name),
	}

	if err := s.tagRepo.Create(tag); err != nil {
		return nil, err
	}

	return &dto.TagResponse{
		ID:       tag.ID.String(),
		Name:     tag.Name,
		Slug:     tag.Slug,
		UseCount: tag.UseCount,
	}, nil
}

func (s *tagService) DeleteTag(id string) error {
	tagID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("invalid tag ID")
	}
	return s.tagRepo.Delete(tagID)
}

func (s *tagService) slugify(text string) string {
	text = strings.ToLower(text)
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	text = reg.ReplaceAllString(text, "-")
	text = strings.Trim(text, "-")
	return text
}
