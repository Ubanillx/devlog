package v1

import (
	"backend/internal/model/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	tagService service.TagService
}

func NewTagHandler(tagService service.TagService) *TagHandler {
	return &TagHandler{tagService: tagService}
}

// GetTags godoc
// @Summary Get all tags
// @Tags tags
// @Success 200 {object} dto.APIResponse{data=dto.TagListResponse}
// @Router /tags [get]
func (h *TagHandler) GetTags(c *gin.Context) {
	response, err := h.tagService.GetAllTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to fetch tags"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(response))
}

// CreateTag godoc
// @Summary Create a new tag
// @Tags tags
// @Security BearerAuth
// @Param tag body dto.CreateTagRequest true "Tag data"
// @Success 201 {object} dto.APIResponse{data=dto.TagResponse}
// @Router /tags [post]
func (h *TagHandler) CreateTag(c *gin.Context) {
	var req dto.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	response, err := h.tagService.CreateTag(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.Created(response))
}

// DeleteTag godoc
// @Summary Delete a tag
// @Tags tags
// @Security BearerAuth
// @Param id path string true "Tag ID"
// @Success 200 {object} dto.APIResponse
// @Router /tags/{id} [delete]
func (h *TagHandler) DeleteTag(c *gin.Context) {
	id := c.Param("id")

	if err := h.tagService.DeleteTag(id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to delete tag"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(nil))
}
