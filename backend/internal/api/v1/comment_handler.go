package v1

import (
	"backend/internal/model/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CommentHandler struct {
	commentService service.CommentService
}

func NewCommentHandler(commentService service.CommentService) *CommentHandler {
	return &CommentHandler{commentService: commentService}
}

// GetComments godoc
// @Summary Get comments for a post
// @Tags comments
// @Param id path string true "Post ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} dto.APIResponse{data=dto.CommentListResponse}
// @Router /posts/{id}/comments [get]
func (h *CommentHandler) GetComments(c *gin.Context) {
	postID := c.Param("id")

	var query dto.CommentListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	response, err := h.commentService.GetCommentsByPostID(postID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to fetch comments"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}

// CreateComment godoc
// @Summary Create a comment on a post
// @Tags comments
// @Param id path string true "Post ID"
// @Param comment body dto.CreateCommentRequest true "Comment data"
// @Success 201 {object} dto.APIResponse{data=dto.CommentResponse}
// @Router /posts/{id}/comments [post]
func (h *CommentHandler) CreateComment(c *gin.Context) {
	postID := c.Param("id")

	var req dto.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	response, err := h.commentService.CreateComment(postID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.Created(response))
}

// ReplyComment godoc
// @Summary Reply to a comment (admin only)
// @Tags comments
// @Security BearerAuth
// @Param id path string true "Comment ID"
// @Param reply body dto.ReplyCommentRequest true "Reply data"
// @Success 201 {object} dto.APIResponse{data=dto.CommentResponse}
// @Router /comments/{id}/reply [post]
func (h *CommentHandler) ReplyComment(c *gin.Context) {
	commentID := c.Param("id")

	var req dto.ReplyCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	// Get admin username from context
	username, _ := c.Get("adminUsername")
	adminUsername, _ := username.(string)
	if adminUsername == "" {
		adminUsername = "admin"
	}

	response, err := h.commentService.ReplyComment(commentID, req, adminUsername)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.Created(response))
}

// GuestReplyComment godoc
// @Summary Reply to a comment (public)
// @Tags comments
// @Param id path string true "Comment ID"
// @Param reply body dto.GuestReplyRequest true "Reply data"
// @Success 201 {object} dto.APIResponse{data=dto.CommentResponse}
// @Router /comments/{id}/guest-reply [post]
func (h *CommentHandler) GuestReplyComment(c *gin.Context) {
	commentID := c.Param("id")

	var req dto.GuestReplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	response, err := h.commentService.GuestReplyComment(commentID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.Created(response))
}

// DeleteComment godoc
// @Summary Delete a comment (admin only)
// @Tags comments
// @Security BearerAuth
// @Param id path string true "Comment ID"
// @Success 200 {object} dto.APIResponse
// @Router /comments/{id} [delete]
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id := c.Param("id")

	if err := h.commentService.DeleteComment(id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to delete comment"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(nil))
}

// GetAllComments (Admin) - get all comments for moderation
func (h *CommentHandler) GetAllComments(c *gin.Context) {
	var query dto.CommentListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	response, err := h.commentService.GetAllCommentsForAdmin(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to fetch comments"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}
