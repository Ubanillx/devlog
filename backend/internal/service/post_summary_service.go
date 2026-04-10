package service

import (
	"backend/internal/repository"
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

type SummaryRateLimitError struct {
	RetryAfter time.Duration
}

func (e *SummaryRateLimitError) Error() string {
	seconds := int(e.RetryAfter.Seconds())
	if seconds < 1 {
		seconds = 1
	}
	return fmt.Sprintf("summary regeneration rate limit exceeded, retry in %d seconds", seconds)
}

type PostSummaryService interface {
	GetCachedSummary(postID string) (string, error)
	GetOrGenerateSummary(ctx context.Context, postID string, force bool, requesterKey string) (string, error)
}

type postSummaryService struct {
	postRepo  repository.PostRepository
	aiRepo    repository.AIContentRepository
	aiService AIService
	limiter   *summaryRateLimiter
}

type summaryRateLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	history map[string][]time.Time
}

func newSummaryRateLimiter(limit int, window time.Duration) *summaryRateLimiter {
	return &summaryRateLimiter{
		limit:   limit,
		window:  window,
		history: make(map[string][]time.Time),
	}
}

func (l *summaryRateLimiter) Allow(key string) (bool, time.Duration) {
	if strings.TrimSpace(key) == "" {
		key = "anonymous"
	}

	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	timestamps := l.history[key]
	kept := timestamps[:0]
	for _, ts := range timestamps {
		if now.Sub(ts) < l.window {
			kept = append(kept, ts)
		}
	}

	if len(kept) >= l.limit {
		retryAfter := l.window - now.Sub(kept[0])
		l.history[key] = kept
		return false, retryAfter
	}

	l.history[key] = append(kept, now)
	return true, 0
}

func NewPostSummaryService(
	postRepo repository.PostRepository,
	aiRepo repository.AIContentRepository,
	aiService AIService,
) PostSummaryService {
	return &postSummaryService{
		postRepo:  postRepo,
		aiRepo:    aiRepo,
		aiService: aiService,
		limiter:   newSummaryRateLimiter(5, time.Minute),
	}
}

func (s *postSummaryService) GetCachedSummary(postID string) (string, error) {
	parsedID, err := uuid.Parse(postID)
	if err != nil {
		return "", errors.New("invalid post ID")
	}

	record, err := s.aiRepo.FindLatestSuccessfulSummary(parsedID)
	if err != nil {
		return "", err
	}
	if record == nil {
		return "", nil
	}
	return strings.TrimSpace(record.GeneratedSummary), nil
}

func (s *postSummaryService) GetOrGenerateSummary(
	ctx context.Context,
	postID string,
	force bool,
	requesterKey string,
) (string, error) {
	parsedID, err := uuid.Parse(postID)
	if err != nil {
		return "", errors.New("invalid post ID")
	}

	cached, err := s.aiRepo.FindLatestSuccessfulSummary(parsedID)
	if err != nil {
		return "", err
	}
	if cached != nil {
		summary := strings.TrimSpace(cached.GeneratedSummary)
		if summary != "" && !force {
			return summary, nil
		}
	}

	allowed, retryAfter := s.limiter.Allow(requesterKey)
	if !allowed {
		return "", &SummaryRateLimitError{RetryAfter: retryAfter}
	}

	post, err := s.postRepo.FindByID(parsedID)
	if err != nil {
		return "", err
	}

	summary, err := s.aiService.SummarizePost(ctx, post.Title, post.Content)
	if err != nil {
		_ = s.aiRepo.CreateSummaryFailure(parsedID, s.aiService.Provider(), err.Error())
		return "", err
	}

	summary = strings.TrimSpace(summary)
	if summary == "" {
		err = errors.New("empty summary generated")
		_ = s.aiRepo.CreateSummaryFailure(parsedID, s.aiService.Provider(), err.Error())
		return "", err
	}

	if err := s.aiRepo.CreateSummarySuccess(parsedID, summary, s.aiService.Provider()); err != nil {
		return "", err
	}

	return summary, nil
}
