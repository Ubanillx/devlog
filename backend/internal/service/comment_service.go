package service

import (
	"backend/internal/model/dto"
	"backend/internal/model/entity"
	"backend/internal/repository"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type CommentService interface {
	GetCommentsByPostID(postID string, query dto.CommentListQuery) (*dto.CommentListResponse, error)
	CreateComment(postID string, req dto.CreateCommentRequest) (*dto.CommentResponse, error)
	ReplyComment(commentID string, req dto.ReplyCommentRequest, adminUsername string) (*dto.CommentResponse, error)
	GuestReplyComment(commentID string, req dto.GuestReplyRequest) (*dto.CommentResponse, error)
	DeleteComment(id string) error
	GetAllCommentsForAdmin(query dto.CommentListQuery) (*dto.CommentListResponse, error)
}

type commentService struct {
	commentRepo repository.CommentRepository
	postRepo    repository.PostRepository
}

func NewCommentService(commentRepo repository.CommentRepository, postRepo repository.PostRepository) CommentService {
	return &commentService{
		commentRepo: commentRepo,
		postRepo:    postRepo,
	}
}

func (s *commentService) GetCommentsByPostID(postID string, query dto.CommentListQuery) (*dto.CommentListResponse, error) {
	pID, err := uuid.Parse(postID)
	if err != nil {
		return nil, errors.New("invalid post ID")
	}

	comments, total, err := s.commentRepo.FindByPostID(pID, query.Page, query.PageSize)
	if err != nil {
		return nil, err
	}

	commentResponses := make([]dto.CommentResponse, len(comments))
	for i, comment := range comments {
		commentResponses[i] = s.toCommentResponse(&comment)
	}

	totalPages := int(total) / query.PageSize
	if int(total)%query.PageSize > 0 {
		totalPages++
	}

	return &dto.CommentListResponse{
		Comments:   commentResponses,
		Total:      total,
		Page:       query.Page,
		PageSize:   query.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *commentService) CreateComment(postID string, req dto.CreateCommentRequest) (*dto.CommentResponse, error) {
	pID, err := uuid.Parse(postID)
	if err != nil {
		return nil, errors.New("invalid post ID")
	}

	// Verify post exists
	_, err = s.postRepo.FindByID(pID)
	if err != nil {
		return nil, errors.New("post not found")
	}

	comment := &entity.Comment{
		PostID:  &pID,
		Author:  req.Author,
		Content: req.Content,
		Role:    "guest",
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	response := s.toCommentResponse(comment)
	return &response, nil
}

func (s *commentService) ReplyComment(commentID string, req dto.ReplyCommentRequest, adminUsername string) (*dto.CommentResponse, error) {
	cID, err := uuid.Parse(commentID)
	if err != nil {
		return nil, errors.New("invalid comment ID")
	}

	// Get parent comment
	parent, err := s.commentRepo.FindByID(cID)
	if err != nil {
		return nil, errors.New("comment not found")
	}

	reply := &entity.Comment{
		PostID:   parent.PostID,
		ParentID: &cID,
		Author:   adminUsername,
		Content:  req.Content,
		Role:     "admin",
	}

	if err := s.commentRepo.Create(reply); err != nil {
		return nil, err
	}

	response := s.toCommentResponse(reply)
	return &response, nil
}

func (s *commentService) GuestReplyComment(commentID string, req dto.GuestReplyRequest) (*dto.CommentResponse, error) {
	cID, err := uuid.Parse(commentID)
	if err != nil {
		return nil, errors.New("invalid comment ID")
	}

	// Get parent comment
	parent, err := s.commentRepo.FindByID(cID)
	if err != nil {
		return nil, errors.New("comment not found")
	}

	reply := &entity.Comment{
		PostID:   parent.PostID,
		ParentID: &cID,
		Author:   req.Author,
		Content:  req.Content,
		Role:     "guest",
	}

	if err := s.commentRepo.Create(reply); err != nil {
		return nil, err
	}

	response := s.toCommentResponse(reply)
	return &response, nil
}

func (s *commentService) DeleteComment(id string) error {
	cID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("invalid comment ID")
	}
	return s.commentRepo.SoftDelete(cID)
}

func (s *commentService) GetAllCommentsForAdmin(query dto.CommentListQuery) (*dto.CommentListResponse, error) {
	comments, total, err := s.commentRepo.GetAllForAdmin(query.Page, query.PageSize)
	if err != nil {
		return nil, err
	}

	commentResponses := make([]dto.CommentResponse, len(comments))
	for i, comment := range comments {
		commentResponses[i] = s.toCommentResponse(&comment)
	}

	totalPages := int(total) / query.PageSize
	if int(total)%query.PageSize > 0 {
		totalPages++
	}

	return &dto.CommentListResponse{
		Comments:   commentResponses,
		Total:      total,
		Page:       query.Page,
		PageSize:   query.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *commentService) toCommentResponse(comment *entity.Comment) dto.CommentResponse {
	var postID *string
	if comment.PostID != nil {
		pid := comment.PostID.String()
		postID = &pid
	}

	var replies []dto.CommentResponse
	for _, reply := range comment.Replies {
		replies = append(replies, s.toCommentResponse(&reply))
	}

	return dto.CommentResponse{
		ID:        comment.ID.String(),
		Author:    comment.Author,
		Content:   comment.Content,
		Timestamp: s.formatTimestamp(comment.CreatedAt),
		Role:      comment.Role,
		PostID:    postID,
		CreatedAt: comment.CreatedAt,
		Replies:   replies,
	}
}

func (s *commentService) formatTimestamp(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	switch {
	case diff < time.Minute:
		return "Just now"
	case diff < time.Hour:
		mins := int(diff.Minutes())
		if mins == 1 {
			return "1 minute ago"
		}
		return fmt.Sprintf("%d minutes ago", mins)
	case diff < 24*time.Hour:
		hours := int(diff.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return fmt.Sprintf("%d hours ago", hours)
	default:
		return t.Format("2006-01-02 15:04")
	}
}
