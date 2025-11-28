package service

import (
	"fmt"
	"io"
	"os"
	"path"
	"strings"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/google/uuid"
)

type OSSService interface {
	UploadFile(file io.Reader, filename string, contentType string) (string, error)
}

type ossService struct {
	client     *oss.Client
	bucket     *oss.Bucket
	bucketName string
	baseURL    string
}

func NewOSSService(endpoint, accessKeyID, accessKeySecret, bucketName, baseURL string) (OSSService, error) {
	client, err := oss.New(endpoint, accessKeyID, accessKeySecret)
	if err != nil {
		return nil, fmt.Errorf("failed to create OSS client: %w", err)
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to get bucket: %w", err)
	}

	return &ossService{
		client:     client,
		bucket:     bucket,
		bucketName: bucketName,
		baseURL:    strings.TrimSuffix(baseURL, "/"),
	}, nil
}

func NewOSSServiceFromEnv() (OSSService, error) {
	endpoint := os.Getenv("OSS_ENDPOINT")
	accessKeyID := os.Getenv("OSS_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("OSS_ACCESS_KEY_SECRET")
	bucketName := os.Getenv("OSS_BUCKET_NAME")
	baseURL := os.Getenv("OSS_BASE_URL")

	if endpoint == "" || accessKeyID == "" || accessKeySecret == "" || bucketName == "" {
		return nil, fmt.Errorf("OSS configuration incomplete: endpoint, accessKeyID, accessKeySecret, and bucketName are required")
	}

	return NewOSSService(endpoint, accessKeyID, accessKeySecret, bucketName, baseURL)
}

func (s *ossService) UploadFile(file io.Reader, filename string, contentType string) (string, error) {
	// Generate unique object key with date prefix
	ext := path.Ext(filename)
	datePrefix := time.Now().Format("2006/01/02")
	objectKey := fmt.Sprintf("uploads/%s/%s%s", datePrefix, uuid.New().String(), ext)

	// Set content type
	options := []oss.Option{
		oss.ContentType(contentType),
	}

	// Upload file
	if err := s.bucket.PutObject(objectKey, file, options...); err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Return URL
	if s.baseURL != "" {
		return fmt.Sprintf("%s/%s", s.baseURL, objectKey), nil
	}

	// Fallback to bucket URL
	return fmt.Sprintf("https://%s.%s/%s", s.bucketName, s.client.Config.Endpoint, objectKey), nil
}
