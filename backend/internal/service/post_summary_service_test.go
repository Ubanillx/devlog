package service

import (
	"backend/internal/model/entity"
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
)

type fakePostRepository struct {
	post *entity.BlogPost
	err  error
}

func (r *fakePostRepository) FindAll(page, pageSize int, tag, search, status string) ([]entity.BlogPost, int64, error) {
	return nil, 0, nil
}

func (r *fakePostRepository) FindByID(id uuid.UUID) (*entity.BlogPost, error) {
	if r.err != nil {
		return nil, r.err
	}
	return r.post, nil
}

func (r *fakePostRepository) Create(post *entity.BlogPost) error { return nil }
func (r *fakePostRepository) Update(post *entity.BlogPost) error { return nil }
func (r *fakePostRepository) Delete(id uuid.UUID) error          { return nil }
func (r *fakePostRepository) IncrementViewCount(id uuid.UUID) error {
	return nil
}

type fakeAIContentRepository struct {
	cached       *entity.AIGeneratedContent
	successCalls int
	failureCalls int
	lastSummary  string
}

func (r *fakeAIContentRepository) FindLatestSuccessfulSummary(postID uuid.UUID) (*entity.AIGeneratedContent, error) {
	return r.cached, nil
}

func (r *fakeAIContentRepository) CreateSummarySuccess(postID uuid.UUID, summary string, model string) error {
	r.successCalls++
	r.lastSummary = summary
	r.cached = &entity.AIGeneratedContent{PostID: postID, GeneratedSummary: summary}
	return nil
}

func (r *fakeAIContentRepository) CreateSummaryFailure(postID uuid.UUID, model string, errorMessage string) error {
	r.failureCalls++
	return nil
}

type fakeAIService struct {
	summary string
	err     error
	calls   int
}

func (s *fakeAIService) GenerateExcerpt(ctx context.Context, content string) (string, error) {
	return "", nil
}
func (s *fakeAIService) GenerateReadTime(ctx context.Context, content string) (string, error) {
	return "", nil
}
func (s *fakeAIService) GenerateTags(ctx context.Context, content string) ([]string, error) {
	return nil, nil
}
func (s *fakeAIService) Chat(ctx context.Context, message string) (string, error) {
	return "", nil
}
func (s *fakeAIService) ChatStream(ctx context.Context, message string, onChunk func(chunk string)) error {
	return nil
}
func (s *fakeAIService) SummarizePost(ctx context.Context, title, content string) (string, error) {
	s.calls++
	return s.summary, s.err
}
func (s *fakeAIService) Provider() string {
	return "fake"
}

func TestGetOrGenerateSummaryReturnsCachedSummary(t *testing.T) {
	postID := uuid.New()
	postRepo := &fakePostRepository{
		post: &entity.BlogPost{ID: postID, Title: "cached", Content: "content"},
	}
	aiRepo := &fakeAIContentRepository{
		cached: &entity.AIGeneratedContent{
			PostID:           postID,
			GeneratedSummary: "- cached summary",
		},
	}
	aiService := &fakeAIService{summary: "- generated"}

	svc := &postSummaryService{
		postRepo:  postRepo,
		aiRepo:    aiRepo,
		aiService: aiService,
		limiter:   newSummaryRateLimiter(5, time.Minute),
	}

	summary, err := svc.GetOrGenerateSummary(context.Background(), postID.String(), false, "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if summary != "- cached summary" {
		t.Fatalf("expected cached summary, got %q", summary)
	}
	if aiService.calls != 0 {
		t.Fatalf("expected no AI calls for cached summary, got %d", aiService.calls)
	}
}

func TestGetOrGenerateSummaryPersistsGeneratedSummary(t *testing.T) {
	postID := uuid.New()
	postRepo := &fakePostRepository{
		post: &entity.BlogPost{ID: postID, Title: "new", Content: "content"},
	}
	aiRepo := &fakeAIContentRepository{}
	aiService := &fakeAIService{summary: "- generated summary"}

	svc := &postSummaryService{
		postRepo:  postRepo,
		aiRepo:    aiRepo,
		aiService: aiService,
		limiter:   newSummaryRateLimiter(5, time.Minute),
	}

	summary, err := svc.GetOrGenerateSummary(context.Background(), postID.String(), false, "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if summary != "- generated summary" {
		t.Fatalf("expected generated summary, got %q", summary)
	}
	if aiRepo.successCalls != 1 {
		t.Fatalf("expected one persisted summary, got %d", aiRepo.successCalls)
	}
}

func TestGetOrGenerateSummaryRateLimitsForcedRegeneration(t *testing.T) {
	postID := uuid.New()
	postRepo := &fakePostRepository{
		post: &entity.BlogPost{ID: postID, Title: "title", Content: "content"},
	}
	aiRepo := &fakeAIContentRepository{
		cached: &entity.AIGeneratedContent{
			PostID:           postID,
			GeneratedSummary: "- cached summary",
		},
	}
	aiService := &fakeAIService{summary: "- regenerated summary"}

	svc := &postSummaryService{
		postRepo:  postRepo,
		aiRepo:    aiRepo,
		aiService: aiService,
		limiter:   newSummaryRateLimiter(1, time.Minute),
	}

	_, err := svc.GetOrGenerateSummary(context.Background(), postID.String(), true, "127.0.0.1")
	if err != nil {
		t.Fatalf("expected first forced regeneration to succeed, got %v", err)
	}

	_, err = svc.GetOrGenerateSummary(context.Background(), postID.String(), true, "127.0.0.1")
	if err == nil {
		t.Fatal("expected second forced regeneration to be rate limited")
	}

	var rateLimitErr *SummaryRateLimitError
	if !errors.As(err, &rateLimitErr) {
		t.Fatalf("expected rate limit error, got %v", err)
	}
}
