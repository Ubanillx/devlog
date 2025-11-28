package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/googleai"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/llms/openai"
)

// 博客内容分析助手系统提示词
const systemPrompt = `你是 DevLog 博客的内容分析助手。你的职责是：

1. **角色定位**：专注于技术博客内容的分析、解读和讨论
2. **能力范围**：
   - 解答与博客文章相关的技术问题
   - 分析和总结博客内容
   - 讨论文章中涉及的技术概念（如 React、TypeScript、架构设计等）
   - 提供代码相关的建议和解释

3. **限制**：
   - 只回答与技术、编程、软件开发相关的问题
   - 不回答与博客内容无关的问题（如天气、新闻、娱乐等）
   - 如果用户询问无关话题，礼貌地引导回技术讨论

4. **回答风格**：
   - 简洁专业，使用中文回答
   - 适当使用代码示例
   - 保持友好但专注于技术内容

如果用户的问题与技术/博客内容无关，请回复："抱歉，我是博客内容分析助手，只能回答与技术和博客内容相关的问题。有什么技术问题我可以帮您解答吗？"`

type AIService interface {
	GenerateExcerpt(ctx context.Context, content string) (string, error)
	GenerateReadTime(ctx context.Context, content string) (string, error)
	GenerateTags(ctx context.Context, content string) ([]string, error)
	Chat(ctx context.Context, message string) (string, error)
	ChatStream(ctx context.Context, message string, onChunk func(chunk string)) error
	SummarizePost(ctx context.Context, title, content string) (string, error)
}

type aiService struct {
	llm      llms.Model
	provider string
}

type AIConfig struct {
	Provider string // "openai", "gemini", "ollama", "dashscope"
	APIKey   string
	Model    string
	BaseURL  string // For Ollama or custom endpoints
}

// NewAIService creates a new AI service with the specified provider
func NewAIService(cfg AIConfig) (AIService, error) {
	var llm llms.Model
	var err error

	switch cfg.Provider {
	case "openai":
		opts := []openai.Option{}
		if cfg.APIKey != "" {
			opts = append(opts, openai.WithToken(cfg.APIKey))
		}
		if cfg.Model != "" {
			opts = append(opts, openai.WithModel(cfg.Model))
		}
		llm, err = openai.New(opts...)

	case "gemini":
		opts := []googleai.Option{}
		if cfg.APIKey != "" {
			opts = append(opts, googleai.WithAPIKey(cfg.APIKey))
		}
		if cfg.Model != "" {
			opts = append(opts, googleai.WithDefaultModel(cfg.Model))
		} else {
			opts = append(opts, googleai.WithDefaultModel("gemini-pro"))
		}
		llm, err = googleai.New(ctx(), opts...)

	case "ollama":
		opts := []ollama.Option{}
		if cfg.BaseURL != "" {
			opts = append(opts, ollama.WithServerURL(cfg.BaseURL))
		}
		if cfg.Model != "" {
			opts = append(opts, ollama.WithModel(cfg.Model))
		} else {
			opts = append(opts, ollama.WithModel("llama2"))
		}
		llm, err = ollama.New(opts...)

	case "dashscope", "aliyun", "qwen":
		// 阿里云百炼 DashScope - 使用 OpenAI 兼容接口
		opts := []openai.Option{
			openai.WithBaseURL("https://dashscope.aliyuncs.com/compatible-mode/v1"),
		}
		if cfg.APIKey != "" {
			opts = append(opts, openai.WithToken(cfg.APIKey))
		}
		if cfg.Model != "" {
			opts = append(opts, openai.WithModel(cfg.Model))
		} else {
			opts = append(opts, openai.WithModel("qwen-turbo")) // 默认使用通义千问
		}
		llm, err = openai.New(opts...)

	default:
		return nil, errors.New("unsupported AI provider: " + cfg.Provider)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create LLM: %w", err)
	}

	return &aiService{
		llm:      llm,
		provider: cfg.Provider,
	}, nil
}

// NewAIServiceFromEnv creates AI service from environment variables
func NewAIServiceFromEnv() (AIService, error) {
	provider := os.Getenv("AI_PROVIDER")
	if provider == "" {
		provider = "dashscope" // 默认使用阿里云百炼
	}

	model := os.Getenv("AI_MODEL")
	if model == "" {
		model = "qwen-turbo" // 默认模型
	}

	return NewAIService(AIConfig{
		Provider: provider,
		APIKey:   os.Getenv("AI_API_KEY"),
		Model:    model,
		BaseURL:  os.Getenv("AI_BASE_URL"),
	})
}

func ctx() context.Context {
	return context.Background()
}

// GenerateExcerpt generates a short excerpt/summary for blog content
func (s *aiService) GenerateExcerpt(ctx context.Context, content string) (string, error) {
	prompt := fmt.Sprintf(`Generate a concise excerpt (2-3 sentences, max 200 characters) for this blog post. 
The excerpt should be engaging and summarize the key point. Return only the excerpt text, no quotes or labels.

Content:
%s`, content)

	return s.generate(ctx, prompt)
}

// GenerateReadTime estimates reading time for content
func (s *aiService) GenerateReadTime(ctx context.Context, content string) (string, error) {
	prompt := fmt.Sprintf(`Estimate the reading time for this article. 
Consider average reading speed of 200 words per minute.
Return only the time in format like "5 min" or "12 min", nothing else.

Content:
%s`, content)

	return s.generate(ctx, prompt)
}

// GenerateTags generates relevant tags for blog content
func (s *aiService) GenerateTags(ctx context.Context, content string) ([]string, error) {
	prompt := fmt.Sprintf(`Analyze this blog post and generate 3-5 relevant tags.
Rules:
- Tags should be in English
- Each tag should be capitalized (e.g., "React", "TypeScript", "Web Development")
- Return ONLY a JSON array of strings, nothing else
- Example output: ["React", "TypeScript", "Performance"]

Content:
%s`, content)

	result, err := s.generate(ctx, prompt)
	if err != nil {
		return nil, err
	}

	// Parse JSON array from response
	var tags []string
	// Try to extract JSON array from response
	start := -1
	end := -1
	for i, c := range result {
		if c == '[' && start == -1 {
			start = i
		}
		if c == ']' {
			end = i + 1
		}
	}

	if start != -1 && end != -1 {
		jsonStr := result[start:end]
		if err := json.Unmarshal([]byte(jsonStr), &tags); err == nil {
			return tags, nil
		}
	}

	// Fallback: split by comma if JSON parsing fails
	parts := strings.Split(result, ",")
	for _, p := range parts {
		tag := strings.Trim(strings.TrimSpace(p), `"[]`)
		if tag != "" {
			tags = append(tags, tag)
		}
	}

	return tags, nil
}

// Chat handles general chat/Q&A about the blog
func (s *aiService) Chat(ctx context.Context, message string) (string, error) {
	prompt := fmt.Sprintf(`%s

用户问题: %s`, systemPrompt, message)

	return s.generate(ctx, prompt)
}

// ChatStream handles streaming chat responses
func (s *aiService) ChatStream(ctx context.Context, message string, onChunk func(chunk string)) error {
	prompt := fmt.Sprintf(`%s

用户问题: %s`, systemPrompt, message)

	_, err := llms.GenerateFromSinglePrompt(ctx, s.llm, prompt,
		llms.WithTemperature(0.7),
		llms.WithMaxTokens(1000),
		llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
			onChunk(string(chunk))
			return nil
		}),
	)
	return err
}

// SummarizePost creates a comprehensive summary of a blog post
func (s *aiService) SummarizePost(ctx context.Context, title, content string) (string, error) {
	prompt := fmt.Sprintf(`Summarize this blog post in 3-5 bullet points. 
Focus on key takeaways that a developer would find valuable.
Format as markdown bullet points.

Title: %s

Content:
%s`, title, content)

	return s.generate(ctx, prompt)
}

func (s *aiService) generate(ctx context.Context, prompt string) (string, error) {
	response, err := llms.GenerateFromSinglePrompt(ctx, s.llm, prompt,
		llms.WithTemperature(0.7),
		llms.WithMaxTokens(500),
	)
	if err != nil {
		return "", fmt.Errorf("AI generation failed: %w", err)
	}
	return response, nil
}
