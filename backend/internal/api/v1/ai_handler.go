package v1

import (
	"backend/internal/model/dto"
	"backend/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	aiService          service.AIService
	postSummaryService service.PostSummaryService
}

func NewAIHandler(aiService service.AIService, postSummaryService service.PostSummaryService) *AIHandler {
	return &AIHandler{
		aiService:          aiService,
		postSummaryService: postSummaryService,
	}
}

// GenerateExcerpt godoc
// @Summary Generate excerpt for content
// @Tags ai
// @Security BearerAuth
// @Param request body dto.GenerateExcerptRequest true "Content to summarize"
// @Success 200 {object} dto.APIResponse{data=dto.AIGenerationResponse}
// @Router /ai/excerpt [post]
func (h *AIHandler) GenerateExcerpt(c *gin.Context) {
	var req dto.GenerateExcerptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	result, err := h.aiService.GenerateExcerpt(c.Request.Context(), req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "AI generation failed: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.Success(dto.AIGenerationResponse{
		Result: result,
	}))
}

// GenerateReadTime godoc
// @Summary Generate reading time estimate
// @Tags ai
// @Security BearerAuth
// @Param request body dto.GenerateReadTimeRequest true "Content to analyze"
// @Success 200 {object} dto.APIResponse{data=dto.AIGenerationResponse}
// @Router /ai/readtime [post]
func (h *AIHandler) GenerateReadTime(c *gin.Context) {
	var req dto.GenerateReadTimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	result, err := h.aiService.GenerateReadTime(c.Request.Context(), req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "AI generation failed: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.Success(dto.AIGenerationResponse{
		Result: result,
	}))
}

// GenerateTags godoc
// @Summary Generate tags for content
// @Tags ai
// @Security BearerAuth
// @Param request body dto.GenerateTagsRequest true "Content to analyze"
// @Success 200 {object} dto.APIResponse{data=dto.TagsGenerationResponse}
// @Router /ai/tags [post]
func (h *AIHandler) GenerateTags(c *gin.Context) {
	var req dto.GenerateTagsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	tags, err := h.aiService.GenerateTags(c.Request.Context(), req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "AI generation failed: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.Success(dto.TagsGenerationResponse{
		Tags: tags,
	}))
}

// Chat godoc
// @Summary Chat with AI assistant
// @Tags ai
// @Param request body dto.ChatRequest true "Chat message"
// @Success 200 {object} dto.APIResponse{data=dto.AIGenerationResponse}
// @Router /ai/chat [post]
func (h *AIHandler) Chat(c *gin.Context) {
	var req dto.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	result, err := h.aiService.Chat(c.Request.Context(), req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "AI chat failed: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.Success(dto.AIGenerationResponse{
		Result: result,
	}))
}

// ChatStream godoc
// @Summary Stream chat with AI assistant (SSE)
// @Tags ai
// @Param request body dto.ChatRequest true "Chat message"
// @Produce text/event-stream
// @Router /ai/chat/stream [post]
func (h *AIHandler) ChatStream(c *gin.Context) {
	var req dto.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// Create context that cancels when client disconnects
	ctx := c.Request.Context()

	// Stream response
	err := h.aiService.ChatStream(ctx, req.Message, func(chunk string) {
		// Send SSE event
		c.SSEvent("message", chunk)
		c.Writer.Flush()
	})

	if err != nil {
		c.SSEvent("error", err.Error())
		c.Writer.Flush()
		return
	}

	// Send done event
	c.SSEvent("done", "[DONE]")
	c.Writer.Flush()
}

// SummarizePost godoc
// @Summary Summarize a blog post
// @Tags ai
// @Security BearerAuth
// @Param request body dto.SummarizePostRequest true "Post to summarize"
// @Success 200 {object} dto.APIResponse{data=dto.AIGenerationResponse}
// @Router /ai/summarize [post]
func (h *AIHandler) SummarizePost(c *gin.Context) {
	var req dto.SummarizePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	result, err := h.aiService.SummarizePost(c.Request.Context(), req.Title, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "AI summarization failed: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.Success(dto.AIGenerationResponse{
		Result: result,
	}))
}

func (h *AIHandler) GeneratePostSummary(c *gin.Context) {
	if h.postSummaryService == nil {
		c.JSON(http.StatusServiceUnavailable, dto.Error(503, "AI summary service is unavailable"))
		return
	}

	var req dto.GeneratePostSummaryRequest
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
			return
		}
	}

	result, err := h.postSummaryService.GetOrGenerateSummary(
		c.Request.Context(),
		c.Param("id"),
		req.Force,
		c.ClientIP(),
	)
	if err != nil {
		var rateLimitErr *service.SummaryRateLimitError
		if errors.As(err, &rateLimitErr) {
			c.JSON(http.StatusTooManyRequests, dto.Error(429, "Summary regeneration limit reached. Please try again later."))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Error(500, "AI summarization failed: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.Success(dto.AIGenerationResponse{
		Result: result,
	}))
}
