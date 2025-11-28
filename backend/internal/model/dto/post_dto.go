package dto

import "time"

// ========== Request DTOs ==========

type CreatePostRequest struct {
	Title    string   `json:"title" binding:"required,max=500"`
	Excerpt  string   `json:"excerpt" binding:"required"`
	Content  string   `json:"content" binding:"required"`
	Tags     []string `json:"tags" binding:"required,min=1"`
	ReadTime string   `json:"readTime,omitempty"`
}

type UpdatePostRequest struct {
	Title       *string  `json:"title,omitempty" binding:"omitempty,max=500"`
	Excerpt     *string  `json:"excerpt,omitempty"`
	Content     *string  `json:"content,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	ReadTime    *string  `json:"readTime,omitempty"`
	IsPublished *bool    `json:"is_published,omitempty"`
}

type PostListQuery struct {
	Page     int    `form:"page,default=1" binding:"min=1"`
	PageSize int    `form:"page_size,default=10" binding:"min=1,max=100"`
	Tag      string `form:"tag"`
	Search   string `form:"search"`
	Status   string `form:"status"` // "published", "draft", "all"
}

// ========== Response DTOs ==========

// PostListItem - 列表项，不包含 content
type PostListItem struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Date        string    `json:"date"`
	Tags        []string  `json:"tags"`
	Excerpt     string    `json:"excerpt"`
	ReadTime    string    `json:"readTime"`
	ViewCount   int       `json:"viewCount"`
	IsPublished bool      `json:"isPublished"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// PostResponse - 完整文章详情，包含 content
type PostResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Date        string    `json:"date"`
	Tags        []string  `json:"tags"`
	Excerpt     string    `json:"excerpt"`
	Content     string    `json:"content"`
	ReadTime    string    `json:"readTime"`
	ViewCount   int       `json:"viewCount"`
	IsPublished bool      `json:"isPublished"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PostListResponse struct {
	Posts      []PostListItem `json:"posts"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"pageSize"`
	TotalPages int            `json:"totalPages"`
}
