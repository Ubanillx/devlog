package service

import (
	"backend/internal/model/dto"
	"backend/internal/model/entity"
	"backend/internal/repository"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

type PostService interface {
	GetPosts(query dto.PostListQuery) (*dto.PostListResponse, error)
	GetPostByID(id string) (*dto.PostResponse, error)
	CreatePost(req dto.CreatePostRequest, authorID *uuid.UUID) (*dto.PostResponse, error)
	UpdatePost(id string, req dto.UpdatePostRequest) (*dto.PostResponse, error)
	DeletePost(id string) error
}

type postService struct {
	postRepo repository.PostRepository
	tagRepo  repository.TagRepository
}

func NewPostService(postRepo repository.PostRepository, tagRepo repository.TagRepository) PostService {
	return &postService{
		postRepo: postRepo,
		tagRepo:  tagRepo,
	}
}

func (s *postService) GetPosts(query dto.PostListQuery) (*dto.PostListResponse, error) {
	posts, total, err := s.postRepo.FindAll(query.Page, query.PageSize, query.Tag, query.Search, query.Status)
	if err != nil {
		return nil, err
	}

	postResponses := make([]dto.PostListItem, len(posts))
	for i, post := range posts {
		postResponses[i] = s.toPostListItem(&post)
	}

	totalPages := int(total) / query.PageSize
	if int(total)%query.PageSize > 0 {
		totalPages++
	}

	return &dto.PostListResponse{
		Posts:      postResponses,
		Total:      total,
		Page:       query.Page,
		PageSize:   query.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *postService) GetPostByID(id string) (*dto.PostResponse, error) {
	postID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid post ID")
	}

	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return nil, err
	}

	// Increment view count asynchronously
	go s.postRepo.IncrementViewCount(postID)

	response := s.toPostResponse(post)
	return &response, nil
}

func (s *postService) CreatePost(req dto.CreatePostRequest, authorID *uuid.UUID) (*dto.PostResponse, error) {
	// Get or create tags
	tags, err := s.getOrCreateTags(req.Tags)
	if err != nil {
		return nil, err
	}

	// Use provided read time or calculate
	readTime := req.ReadTime
	if readTime == "" {
		readTime = s.calculateReadTime(req.Content)
	}

	post := &entity.BlogPost{
		Title:         req.Title,
		Excerpt:       req.Excerpt,
		Content:       req.Content,
		ReadTime:      readTime,
		PublishedDate: time.Now(),
		IsPublished:   false,
		AuthorID:      authorID,
		Tags:          tags,
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, err
	}

	response := s.toPostResponse(post)
	return &response, nil
}

func (s *postService) UpdatePost(id string, req dto.UpdatePostRequest) (*dto.PostResponse, error) {
	postID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid post ID")
	}

	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Title != nil {
		post.Title = *req.Title
	}
	if req.Excerpt != nil {
		post.Excerpt = *req.Excerpt
	}
	if req.Content != nil {
		post.Content = *req.Content
		// Only auto-calculate if readTime not provided
		if req.ReadTime == nil {
			post.ReadTime = s.calculateReadTime(*req.Content)
		}
	}
	if req.ReadTime != nil {
		post.ReadTime = *req.ReadTime
	}
	if req.IsPublished != nil {
		post.IsPublished = *req.IsPublished
	}
	if req.Tags != nil {
		tags, err := s.getOrCreateTags(req.Tags)
		if err != nil {
			return nil, err
		}
		post.Tags = tags
	}

	if err := s.postRepo.Update(post); err != nil {
		return nil, err
	}

	response := s.toPostResponse(post)
	return &response, nil
}

func (s *postService) DeletePost(id string) error {
	postID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("invalid post ID")
	}
	return s.postRepo.Delete(postID)
}

// toPostListItem - 转换为列表项（不含 content）
func (s *postService) toPostListItem(post *entity.BlogPost) dto.PostListItem {
	tagNames := make([]string, len(post.Tags))
	for i, tag := range post.Tags {
		tagNames[i] = tag.Name
	}

	return dto.PostListItem{
		ID:          post.ID.String(),
		Title:       post.Title,
		Date:        post.PublishedDate.Format("2006-01-02"),
		Tags:        tagNames,
		Excerpt:     post.Excerpt,
		ReadTime:    post.ReadTime,
		ViewCount:   post.ViewCount,
		IsPublished: post.IsPublished,
		CreatedAt:   post.CreatedAt,
		UpdatedAt:   post.UpdatedAt,
	}
}

// toPostResponse - 转换为完整响应（含 content）
func (s *postService) toPostResponse(post *entity.BlogPost) dto.PostResponse {
	tagNames := make([]string, len(post.Tags))
	for i, tag := range post.Tags {
		tagNames[i] = tag.Name
	}

	return dto.PostResponse{
		ID:          post.ID.String(),
		Title:       post.Title,
		Date:        post.PublishedDate.Format("2006-01-02"),
		Tags:        tagNames,
		Excerpt:     post.Excerpt,
		Content:     post.Content,
		ReadTime:    post.ReadTime,
		ViewCount:   post.ViewCount,
		IsPublished: post.IsPublished,
		CreatedAt:   post.CreatedAt,
		UpdatedAt:   post.UpdatedAt,
	}
}

func (s *postService) getOrCreateTags(tagNames []string) ([]entity.Tag, error) {
	var result []entity.Tag
	for _, name := range tagNames {
		tag := entity.Tag{
			Name: name,
			Slug: s.slugify(name),
		}
		if err := s.tagRepo.FindOrCreateBySlug(&tag); err != nil {
			return nil, err
		}
		result = append(result, tag)
	}
	return result, nil
}

func (s *postService) slugify(text string) string {
	text = strings.ToLower(text)
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	text = reg.ReplaceAllString(text, "-")
	text = strings.Trim(text, "-")
	return text
}

func (s *postService) calculateReadTime(content string) string {
	words := len(strings.Fields(content))
	minutes := words / 200
	if minutes < 1 {
		minutes = 1
	}
	return fmt.Sprintf("%d min", minutes)
}
