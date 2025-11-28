package v1

import (
	"backend/internal/model/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PostHandler struct {
	postService service.PostService
}

func NewPostHandler(postService service.PostService) *PostHandler {
	return &PostHandler{postService: postService}
}

// GetPosts godoc
// @Summary Get all posts
// @Tags posts
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param tag query string false "Filter by tag"
// @Param search query string false "Search in title/excerpt"
// @Param status query string false "Filter by status: published, draft, all"
// @Success 200 {object} dto.APIResponse{data=dto.PostListResponse}
// @Router /posts [get]
func (h *PostHandler) GetPosts(c *gin.Context) {
	var query dto.PostListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	// Default to published for public API
	if query.Status == "" {
		query.Status = "published"
	}

	response, err := h.postService.GetPosts(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to fetch posts"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}

// GetPostByID godoc
// @Summary Get post by ID
// @Tags posts
// @Param id path string true "Post ID"
// @Success 200 {object} dto.APIResponse{data=dto.PostResponse}
// @Router /posts/{id} [get]
func (h *PostHandler) GetPostByID(c *gin.Context) {
	id := c.Param("id")

	response, err := h.postService.GetPostByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.Error(404, "Post not found"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}

// CreatePost godoc
// @Summary Create a new post
// @Tags posts
// @Security BearerAuth
// @Param post body dto.CreatePostRequest true "Post data"
// @Success 201 {object} dto.APIResponse{data=dto.PostResponse}
// @Router /posts [post]
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req dto.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	// Get author ID from context (set by auth middleware)
	var authorID *uuid.UUID
	if id, exists := c.Get("adminID"); exists {
		if uid, ok := id.(uuid.UUID); ok {
			authorID = &uid
		}
	}

	response, err := h.postService.CreatePost(req, authorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to create post"))
		return
	}

	c.JSON(http.StatusCreated, dto.Created(response))
}

// UpdatePost godoc
// @Summary Update a post
// @Tags posts
// @Security BearerAuth
// @Param id path string true "Post ID"
// @Param post body dto.UpdatePostRequest true "Post data"
// @Success 200 {object} dto.APIResponse{data=dto.PostResponse}
// @Router /posts/{id} [put]
func (h *PostHandler) UpdatePost(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	response, err := h.postService.UpdatePost(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to update post"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}

// DeletePost godoc
// @Summary Delete a post
// @Tags posts
// @Security BearerAuth
// @Param id path string true "Post ID"
// @Success 200 {object} dto.APIResponse
// @Router /posts/{id} [delete]
func (h *PostHandler) DeletePost(c *gin.Context) {
	id := c.Param("id")

	if err := h.postService.DeletePost(id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to delete post"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(nil))
}

// GetAllPosts godoc
// @Summary Get all posts (Admin)
// @Description Get all posts including drafts, requires authentication
// @Tags posts
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param status query string false "Filter by status: published, draft, all" default(all)
// @Success 200 {object} dto.APIResponse{data=dto.PostListResponse}
// @Router /admin/posts [get]
func (h *PostHandler) GetAllPosts(c *gin.Context) {
	var query dto.PostListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	// Admin can see all posts
	if query.Status == "" {
		query.Status = "all"
	}

	response, err := h.postService.GetPosts(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to fetch posts"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}
