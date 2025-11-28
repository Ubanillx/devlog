package dto

import "time"

// ========== Request DTOs ==========

type CreateCommentRequest struct {
	Author  string `json:"author" binding:"required,max=100"`
	Content string `json:"content" binding:"required,min=1"`
}

type ReplyCommentRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}

type GuestReplyRequest struct {
	Author  string `json:"author" binding:"required,max=100"`
	Content string `json:"content" binding:"required,min=1"`
}

type CommentListQuery struct {
	Page     int `form:"page,default=1" binding:"min=1"`
	PageSize int `form:"page_size,default=20" binding:"min=1,max=100"`
}

// ========== Response DTOs ==========

type CommentResponse struct {
	ID        string            `json:"id"`
	Author    string            `json:"author"`
	Content   string            `json:"content"`
	Timestamp string            `json:"timestamp"`
	Role      string            `json:"role"`
	PostID    *string           `json:"postId,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	Replies   []CommentResponse `json:"replies,omitempty"`
}

type CommentListResponse struct {
	Comments   []CommentResponse `json:"comments"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"pageSize"`
	TotalPages int               `json:"totalPages"`
}
