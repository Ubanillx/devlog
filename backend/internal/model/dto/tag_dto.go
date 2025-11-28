package dto

// ========== Request DTOs ==========

type CreateTagRequest struct {
	Name string `json:"name" binding:"required,max=50"`
}

// ========== Response DTOs ==========

type TagResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	UseCount int    `json:"useCount"`
}

type TagListResponse struct {
	Tags []TagResponse `json:"tags"`
}
