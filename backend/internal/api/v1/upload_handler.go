package v1

import (
	"backend/internal/model/dto"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	ossService service.OSSService
}

func NewUploadHandler(ossService service.OSSService) *UploadHandler {
	return &UploadHandler{ossService: ossService}
}

// UploadFile godoc
// @Summary Upload a file to OSS
// @Description Upload a binary file and return the public URL
// @Tags upload
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "File to upload"
// @Success 200 {object} dto.APIResponse{data=UploadResponse}
// @Failure 400 {object} dto.APIResponse
// @Failure 500 {object} dto.APIResponse
// @Router /upload [post]
func (h *UploadHandler) UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.Error(400, "No file provided"))
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	url, err := h.ossService.UploadFile(file, header.Filename, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Error(500, "Failed to upload file"))
		return
	}

	c.JSON(http.StatusOK, dto.Success(UploadResponse{
		URL:      url,
		Filename: header.Filename,
		Size:     header.Size,
	}))
}

type UploadResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
}
