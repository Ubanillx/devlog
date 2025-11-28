package dto

// ========== Request DTOs ==========

type GenerateExcerptRequest struct {
	Content string `json:"content" binding:"required"`
}

type GenerateTagsRequest struct {
	Content string `json:"content" binding:"required"`
}

type GenerateReadTimeRequest struct {
	Content string `json:"content" binding:"required"`
}

type ChatRequest struct {
	Message string `json:"message" binding:"required"`
}

type SummarizePostRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

// ========== Response DTOs ==========

type AIGenerationResponse struct {
	Result     string `json:"result"`
	Provider   string `json:"provider"`
	TokensUsed int    `json:"tokensUsed,omitempty"`
}

type TagsGenerationResponse struct {
	Tags       []string `json:"tags"`
	Provider   string   `json:"provider"`
	TokensUsed int      `json:"tokensUsed,omitempty"`
}
