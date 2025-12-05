package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/config"
	"backend/internal/repository"
)

type SEOService interface {
	Start(ctx context.Context)
	PushAllURLs() error
	PushURL(url string) error
}

type seoService struct {
	cfg      config.SEOConfig
	postRepo repository.PostRepository
	client   *http.Client
}

func NewSEOService(cfg config.SEOConfig, postRepo repository.PostRepository) SEOService {
	return &seoService{
		cfg:      cfg,
		postRepo: postRepo,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Start begins the scheduled URL pushing
func (s *seoService) Start(ctx context.Context) {
	if s.cfg.SiteURL == "" {
		log.Println("SEO service disabled: SEO_SITE_URL not configured")
		return
	}

	interval, err := time.ParseDuration(s.cfg.PushInterval)
	if err != nil {
		interval = 24 * time.Hour
	}

	log.Printf("SEO service started, pushing URLs every %s", interval)

	// Initial push
	go func() {
		time.Sleep(10 * time.Second) // Wait for server to fully start
		if err := s.PushAllURLs(); err != nil {
			log.Printf("Initial SEO push failed: %v", err)
		}
	}()

	// Scheduled push
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("SEO service stopped")
			return
		case <-ticker.C:
			if err := s.PushAllURLs(); err != nil {
				log.Printf("Scheduled SEO push failed: %v", err)
			}
		}
	}
}

// PushAllURLs fetches latest published posts and pushes their URLs
func (s *seoService) PushAllURLs() error {
	log.Println("Starting SEO URL push...")

	// Only push latest 5 posts to avoid exceeding Baidu daily quota
	posts, _, err := s.postRepo.FindAll(1, 5, "", "", "published")
	if err != nil {
		return fmt.Errorf("failed to fetch posts: %w", err)
	}

	var urls []string
	// Add homepage
	urls = append(urls, s.cfg.SiteURL)
	// Add about page
	urls = append(urls, s.cfg.SiteURL+"/?view=about")
	// Add latest post URLs
	for _, post := range posts {
		urls = append(urls, fmt.Sprintf("%s/?post=%s", s.cfg.SiteURL, post.ID))
	}

	log.Printf("Pushing %d URLs to search engines", len(urls))

	// Push to Baidu
	if s.cfg.BaiduToken != "" && s.cfg.BaiduSite != "" {
		if err := s.pushToBaidu(urls); err != nil {
			log.Printf("Baidu push failed: %v", err)
		} else {
			log.Println("Baidu push successful")
		}
	}

	// Push to Bing (IndexNow)
	if s.cfg.BingAPIKey != "" {
		if err := s.pushToBing(urls); err != nil {
			log.Printf("Bing push failed: %v", err)
		} else {
			log.Println("Bing push successful")
		}
	}

	log.Println("SEO URL push completed")
	return nil
}

// PushURL pushes a single URL to all configured search engines
func (s *seoService) PushURL(url string) error {
	urls := []string{url}

	if s.cfg.BaiduToken != "" && s.cfg.BaiduSite != "" {
		if err := s.pushToBaidu(urls); err != nil {
			log.Printf("Baidu push failed for %s: %v", url, err)
		}
	}

	if s.cfg.BingAPIKey != "" {
		if err := s.pushToBing(urls); err != nil {
			log.Printf("Bing push failed for %s: %v", url, err)
		}
	}

	return nil
}

// pushToBaidu pushes URLs to Baidu webmaster API
// API: http://data.zz.baidu.com/urls?site=xxx&token=xxx
func (s *seoService) pushToBaidu(urls []string) error {
	apiURL := fmt.Sprintf("http://data.zz.baidu.com/urls?site=%s&token=%s", s.cfg.BaiduSite, s.cfg.BaiduToken)
	body := strings.Join(urls, "\n")

	req, err := http.NewRequest("POST", apiURL, strings.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "text/plain")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("baidu API returned %d: %s", resp.StatusCode, string(respBody))
	}

	log.Printf("Baidu response: %s", string(respBody))
	return nil
}

// pushToBing pushes URLs using IndexNow protocol
// https://www.indexnow.org/documentation
func (s *seoService) pushToBing(urls []string) error {
	// Parse host from site URL
	host := strings.TrimPrefix(s.cfg.SiteURL, "https://")
	host = strings.TrimPrefix(host, "http://")
	host = strings.Split(host, "/")[0]

	payload := map[string]interface{}{
		"host":        host,
		"key":         s.cfg.BingAPIKey,
		"keyLocation": fmt.Sprintf("%s/%s.txt", s.cfg.SiteURL, s.cfg.BingAPIKey),
		"urlList":     urls,
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.indexnow.org/indexnow", bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// IndexNow returns 200, 202, or 400/422 for errors
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("IndexNow API returned %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}
