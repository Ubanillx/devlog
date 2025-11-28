import React, { useState, useEffect } from 'react';
import { Comment } from '../types';
import { CommentsService } from '../api-client';

interface CommentSectionProps {
  postId: string;
}

// 递归映射评论
const mapComment = (c: any): Comment => ({
  id: c.id || '',
  author: c.author || 'Anonymous',
  content: c.content || '',
  timestamp: c.timestamp || '',
  role: (c.role as 'admin' | 'guest') || 'guest',
  replies: c.replies?.map(mapComment) || []
});

// 单条评论组件
const CommentItem: React.FC<{
  comment: Comment;
  depth: number;
  onReply: (parentId: string, author: string, content: string) => Promise<void>;
}> = ({ comment, depth, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyAuthor.trim() || !replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyAuthor.trim(), replyContent.trim());
      setReplyAuthor('');
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex gap-4 group animate-fade-in ${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${depth > 0 ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'} rounded-full bg-surface-highlight border border-border flex items-center justify-center font-bold text-secondary shadow-sm`}>
        {comment.author.substring(0, 2).toUpperCase()}
      </div>
      
      <div className="flex-grow">
        <div className="bg-surface/40 border border-border rounded-lg p-4 relative hover:border-primary/30 transition-colors">
          {depth === 0 && (
            <div className="absolute top-4 -left-1.5 w-3 h-3 bg-surface/40 border-l border-t border-border transform -rotate-45"></div>
          )}

          <div className="flex items-baseline justify-between mb-2 border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-textLight cursor-pointer hover:underline decoration-primary underline-offset-4">
                {comment.author}
              </span>
              {comment.role === 'admin' && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">MAINTAINER</span>
              )}
            </div>
            <span className="text-xs text-gray-400 font-mono">{comment.timestamp}</span>
          </div>
          
          <div className="text-sm text-text leading-relaxed font-light whitespace-pre-line">
            {comment.content}
          </div>
        </div>
        
        <div className="flex gap-4 mt-2 ml-1">
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-gray-500 hover:text-primary transition-colors"
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3 bg-surface/30 border border-border rounded-lg p-3 space-y-2">
            <input
              type="text"
              placeholder="Your name"
              value={replyAuthor}
              onChange={(e) => setReplyAuthor(e.target.value)}
              className="w-full bg-bg border border-border text-xs px-2 py-1.5 text-text focus:outline-none focus:border-primary rounded placeholder-gray-500 font-mono"
            />
            <textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-bg border border-border text-xs px-2 py-1.5 text-text focus:outline-none focus:border-primary rounded placeholder-gray-500 font-mono resize-none h-16"
            />
            <button
              onClick={handleReply}
              disabled={!replyAuthor.trim() || !replyContent.trim() || isSubmitting}
              className="px-3 py-1 bg-primary text-white text-xs font-bold rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                depth={depth + 1} 
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载评论
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const res = await CommentsService.getPostsComments(postId);
      if (res.data?.comments) {
        setComments(res.data.comments.map(mapComment));
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !authorName.trim()) return;

    setIsSubmitting(true);
    
    try {
      const res = await CommentsService.postPostsComments(postId, {
        author: authorName.trim(),
        content: input.trim()
      });
      
      if (res.data) {
        const newComment = mapComment(res.data);
        setComments([newComment, ...comments]);
        setInput('');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, author: string, content: string) => {
    try {
      const res = await CommentsService.postCommentsGuestReply(parentId, { author, content });
      if (res.data) {
        // 重新加载评论以获取最新的嵌套结构
        await fetchComments();
      }
    } catch (error) {
      console.error('Failed to reply:', error);
      throw error;
    }
  };

  // 计算总评论数（包括回复）
  const countComments = (comments: Comment[]): number => {
    return comments.reduce((acc, c) => acc + 1 + countComments(c.replies || []), 0);
  };

  return (
    <div className="mt-12 border-t border-border pt-10">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-textLight flex items-center gap-2">
          <span className="text-primary text-sm">/**</span> Comments 
          <span className="text-sm text-gray-500 font-normal">({countComments(comments)})</span>
          <span className="text-primary text-sm">*/</span>
        </h3>
      </div>

      {/* Comment Input */}
      <div className={`mb-10 transition-all duration-300 border rounded-lg overflow-hidden ${isFocused ? 'border-primary shadow-lg shadow-primary/5' : 'border-border bg-bg'}`}>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 p-4 pb-0">
            <input
              type="text"
              className="flex-1 bg-surface border border-border text-sm px-3 py-2 text-text focus:outline-none focus:border-primary rounded placeholder-gray-500 font-mono"
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              onFocus={() => setIsFocused(true)}
            />
          </div>
          <textarea
            className="w-full bg-transparent text-sm p-4 text-text focus:outline-none resize-y min-h-[100px] placeholder-gray-500 font-mono leading-relaxed"
            placeholder="// Write a comment... (Markdown supported)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => !input && !authorName && setIsFocused(false)}
          />
          <div className={`flex justify-between items-center px-4 py-3 bg-surface border-t border-border transition-opacity duration-200 ${isFocused || input ? 'opacity-100' : 'opacity-70'}`}>
            <div className="flex gap-2 text-xs text-gray-500 font-mono">
               <span className="hidden sm:inline">Supported: **bold**, *italic*, `code`</span>
            </div>
            <button 
              type="submit"
              disabled={!input.trim() || !authorName.trim() || isSubmitting}
              className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Pushing...
                </>
              ) : (
                'git commit -m "Reply"'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comment List */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-sm text-gray-500">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : null}
        {!isLoading && comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            depth={0} 
            onReply={handleReply}
          />
        ))}
      </div>
    </div>
  );
};