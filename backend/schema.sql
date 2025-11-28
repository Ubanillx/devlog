-- ==========================================
-- DevLog Database Schema for PostgreSQL
-- ==========================================
-- Created: 2024-11-20
-- Description: Complete database schema for personal developer blog
-- ==========================================

-- Note: Using gen_random_uuid() which is built-in since PostgreSQL 13+
-- No extension required

-- Drop existing objects if needed (uncomment to reset database)
-- DROP VIEW IF EXISTS comment_threads CASCADE;
-- DROP VIEW IF EXISTS published_posts_with_tags CASCADE;
-- DROP TABLE IF EXISTS ai_generated_content CASCADE;
-- DROP TABLE IF EXISTS post_tags CASCADE;
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS tags CASCADE;
-- DROP TABLE IF EXISTS blog_posts CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;

-- ==========================================
-- Table: admins
-- Description: Administrator accounts
-- ==========================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE admins IS 'Administrator user accounts';
COMMENT ON COLUMN admins.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN admins.is_active IS 'Soft delete flag for admin accounts';

-- ==========================================
-- Table: blog_posts
-- Description: Blog articles and content
-- ==========================================
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    read_time VARCHAR(20) NOT NULL DEFAULT '1 min',
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    author_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    CONSTRAINT positive_view_count CHECK (view_count >= 0)
);

COMMENT ON TABLE blog_posts IS 'Blog post articles';
COMMENT ON COLUMN blog_posts.content IS 'Markdown formatted content';
COMMENT ON COLUMN blog_posts.read_time IS 'Estimated reading time (e.g., "8 min")';
COMMENT ON COLUMN blog_posts.is_published IS 'Draft/Published status';
COMMENT ON COLUMN blog_posts.view_count IS 'Number of times the post has been viewed';

-- ==========================================
-- Table: tags
-- Description: Article tags/categories
-- ==========================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    use_count INTEGER DEFAULT 0,
    CONSTRAINT positive_use_count CHECK (use_count >= 0)
);

COMMENT ON TABLE tags IS 'Tags for categorizing blog posts';
COMMENT ON COLUMN tags.slug IS 'URL-friendly tag identifier';
COMMENT ON COLUMN tags.use_count IS 'Number of posts using this tag';

-- ==========================================
-- Table: post_tags
-- Description: Many-to-many relationship between posts and tags
-- ==========================================
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id)
);

COMMENT ON TABLE post_tags IS 'Junction table for post-tag many-to-many relationship';

-- ==========================================
-- Table: comments
-- Description: User comments with nested reply support
-- ==========================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_role CHECK (role IN ('guest', 'admin')),
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

COMMENT ON TABLE comments IS 'User comments with nested reply support';
COMMENT ON COLUMN comments.post_id IS 'Associated blog post (NULL for global comments)';
COMMENT ON COLUMN comments.parent_id IS 'Parent comment for nested replies (NULL for top-level)';
COMMENT ON COLUMN comments.role IS 'User role: guest or admin';
COMMENT ON COLUMN comments.is_deleted IS 'Soft delete flag';

-- ==========================================
-- Table: ai_generated_content
-- Description: AI-generated summaries and metadata for blog posts
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    generated_excerpt TEXT,
    generated_read_time VARCHAR(20),
    ai_model VARCHAR(100),
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'success', 'failed', 'applied')),
    CONSTRAINT positive_tokens CHECK (prompt_tokens >= 0 AND completion_tokens >= 0)
);

COMMENT ON TABLE ai_generated_content IS 'AI-generated content suggestions for blog posts';
COMMENT ON COLUMN ai_generated_content.generated_excerpt IS 'AI-generated excerpt/summary';
COMMENT ON COLUMN ai_generated_content.generated_read_time IS 'AI-calculated reading time';
COMMENT ON COLUMN ai_generated_content.ai_model IS 'AI model used (e.g., "gemini-pro", "gpt-4")';
COMMENT ON COLUMN ai_generated_content.prompt_tokens IS 'Number of tokens in the prompt';
COMMENT ON COLUMN ai_generated_content.completion_tokens IS 'Number of tokens in the completion';
COMMENT ON COLUMN ai_generated_content.status IS 'Generation status: pending, success, failed, applied';
COMMENT ON COLUMN ai_generated_content.is_applied IS 'Whether the suggestion has been applied to the post';
COMMENT ON COLUMN ai_generated_content.applied_at IS 'Timestamp when the content was applied to the post';
COMMENT ON COLUMN ai_generated_content.error_message IS 'Error details if generation failed';

-- ==========================================
-- INDEXES
-- ==========================================

-- Blog Posts Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date ON blog_posts(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Tags Indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_use_count ON tags(use_count DESC);

-- Post Tags Indexes
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- Comments Indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

-- Admins Indexes
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- AI Generated Content Indexes
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_post_id ON ai_generated_content(post_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_status ON ai_generated_content(status);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_is_applied ON ai_generated_content(is_applied);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_created_at ON ai_generated_content(created_at DESC);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for blog_posts
CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for comments
CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Update tag use_count
CREATE OR REPLACE FUNCTION update_tag_use_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET use_count = use_count + 1 WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET use_count = use_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update tag use_count
CREATE TRIGGER trigger_update_tag_use_count
    AFTER INSERT OR DELETE ON post_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_use_count();

-- ==========================================
-- INITIAL DATA (Optional)
-- ==========================================

-- Insert default admin (password: 'admin123' - CHANGE THIS IN PRODUCTION!)
-- Password hash generated using bcrypt with cost factor 10
INSERT INTO admins (username, email, password_hash) 
SELECT 'ubanillx', 'liulongxin21@gmail.com', '$2a$10$1JipER3C.iSqM29oY0LJx.hfUUfZgvkgTFCJpFylMF6pcjk2YqP26'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'ubanillx');

-- Insert sample tags
INSERT INTO tags (name, slug) VALUES 
('React', 'react'),
('TypeScript', 'typescript'),
('Architecture', 'architecture'),
('Refactoring', 'refactoring'),
('Tools', 'tools'),
('IDE', 'ide'),
('Productivity', 'productivity'),
('Next.js', 'nextjs'),
('Frontend', 'frontend')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- VIEWS (Optional - Helpful queries)
-- ==========================================

-- View: Published posts with tag counts
CREATE OR REPLACE VIEW published_posts_with_tags AS
SELECT 
    p.id,
    p.title,
    p.excerpt,
    p.published_date,
    p.view_count,
    p.read_time,
    COUNT(pt.tag_id) as tag_count,
    ARRAY_AGG(t.name ORDER BY t.name) as tags
FROM blog_posts p
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.is_published = TRUE
GROUP BY p.id, p.title, p.excerpt, p.published_date, p.view_count, p.read_time
ORDER BY p.published_date DESC;

COMMENT ON VIEW published_posts_with_tags IS 'Published posts with aggregated tag information';

-- View: Comment threads (top-level comments with reply counts)
CREATE OR REPLACE VIEW comment_threads AS
SELECT 
    c.id,
    c.post_id,
    c.author,
    c.content,
    c.role,
    c.created_at,
    COUNT(replies.id) as reply_count
FROM comments c
LEFT JOIN comments replies ON c.id = replies.parent_id AND replies.is_deleted = FALSE
WHERE c.parent_id IS NULL AND c.is_deleted = FALSE
GROUP BY c.id, c.post_id, c.author, c.content, c.role, c.created_at
ORDER BY c.created_at DESC;

COMMENT ON VIEW comment_threads IS 'Top-level comments with reply counts';

-- ==========================================
-- GRANTS (Adjust based on your user setup)
-- ==========================================
-- Example: GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO devlog_user;
-- Example: GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO devlog_user;

-- ==========================================
-- END OF SCHEMA
-- ==========================================
