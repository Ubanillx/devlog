package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	OSS      OSSConfig
	SEO      SEOConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type ServerConfig struct {
	Port        string
	Mode        string
	SSL         bool
	JKSPath     string
	JKSPassword string
}

type OSSConfig struct {
	Endpoint        string
	AccessKeyID     string
	AccessKeySecret string
	BucketName      string
	BaseURL         string // CDN or bucket public URL
}

type SEOConfig struct {
	SiteURL      string
	BaiduSite    string // 百度站点域名
	BaiduToken   string // 百度推送token
	BingAPIKey   string // Bing IndexNow API Key
	PushInterval string // 推送间隔, e.g. "24h"
}

func Load() (*Config, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		// .env file is optional in production
		fmt.Println("Warning: .env file not found, using environment variables")
	}

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "devlog"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "devlog"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Server: ServerConfig{
			Port:        getEnv("SERVER_PORT", "8080"),
			Mode:        getEnv("GIN_MODE", "debug"),
			SSL:         getEnv("SERVER_SSL", "false") == "true",
			JKSPath:     getEnv("SERVER_JKS_PATH", "JKS/blog.ubanillx.com.jks"),
			JKSPassword: getEnv("SERVER_JKS_PASSWORD", "123456"),
		},
		OSS: OSSConfig{
			Endpoint:        getEnv("OSS_ENDPOINT", ""),
			AccessKeyID:     getEnv("OSS_ACCESS_KEY_ID", ""),
			AccessKeySecret: getEnv("OSS_ACCESS_KEY_SECRET", ""),
			BucketName:      getEnv("OSS_BUCKET_NAME", ""),
			BaseURL:         getEnv("OSS_BASE_URL", ""),
		},
		SEO: SEOConfig{
			SiteURL:      getEnv("SEO_SITE_URL", ""),
			BaiduSite:    getEnv("SEO_BAIDU_SITE", ""),
			BaiduToken:   getEnv("SEO_BAIDU_TOKEN", ""),
			BingAPIKey:   getEnv("SEO_BING_API_KEY", ""),
			PushInterval: getEnv("SEO_PUSH_INTERVAL", "24h"),
		},
	}, nil
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode,
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
