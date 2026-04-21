'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { BlogPost, Comment } from '@/lib/types';
import { CommentsService, AiService, UploadService, PostsService, AuthService } from '../api-client';
import { getToken, setToken, clearToken } from '@/lib/api';
import { siteConfig, SiteConfig, defaultConfig } from '@/lib/config';
import { getPreferredClipboardText, insertTextAtSelection } from '@/lib/editorPaste';
import { renderEditorMarkdownPreview } from '@/lib/markdown';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const PAGE_SIZE = 10;
const INLINE_EDITOR_ID = 'post-content-editor';
const FULLSCREEN_EDITOR_ID = 'post-content-editor-fullscreen';

export const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'settings'>('posts');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Posts State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [readTime, setReadTime] = useState('');
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<SiteConfig>(siteConfig);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        await AuthService.getAuthMe();
        setIsLoadingAuth(false);
      } catch {
        clearToken();
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // Fetch posts
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await PostsService.getAdminPosts(1, 100, 'all');
      if (res.data?.posts) {
        setPosts(res.data.posts.map((p: any) => ({
          id: p.id || '',
          title: p.title || '',
          date: p.date || p.publishedDate || '',
          tags: p.tags || [],
          excerpt: p.excerpt || '',
          content: p.content || '',
          readTime: p.readTime || p.read_time || '',
          viewCount: p.viewCount ?? 0,
          isPublished: p.isPublished ?? p.is_published ?? true,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Load posts on mount after auth check
  useEffect(() => {
    if (!isLoadingAuth) {
      fetchPosts();
    }
  }, [isLoadingAuth]);

  // ESC 键退出全屏
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorFullscreen) {
        setIsEditorFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isEditorFullscreen]);

  // 加载所有文章的评论
  useEffect(() => {
    const fetchAllComments = async () => {
      if (activeTab !== 'comments') return;

      setCommentsLoading(true);
      try {
        // 获取最新的100条评论
        const res = await CommentsService.getAdminComments(1, 100);
        if (res.data?.comments) {
          const allComments: Comment[] = res.data.comments.map((c: any) => ({
            id: c.id || '',
            author: c.author || 'Anonymous',
            content: c.content || '',
            timestamp: c.timestamp || '',
            role: (c.role as 'admin' | 'guest') || 'guest',
            postId: c.postId,
            postTitle: c.postTitle,
            parentId: c.parentId
          }));
          setComments(allComments);
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchAllComments();
  }, [activeTab]);

  // 图片上传处理
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const res = await UploadService.postUpload(file);
      if (res.data?.url) {
        return res.data.url;
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const handleEditorPaste = async (event: ClipboardEvent) => {
      const clipboard = event.clipboardData;
      const textarea = event.currentTarget;

      if (!clipboard || !(textarea instanceof HTMLTextAreaElement)) {
        return;
      }

      const plainText = clipboard.getData('text/plain');
      const htmlText = clipboard.getData('text/html');
      const preferredText = getPreferredClipboardText(plainText, htmlText);
      const imageFiles = Array.from(clipboard.items)
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (!preferredText && imageFiles.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const selectionStart = textarea.selectionStart ?? 0;
      const selectionEnd = textarea.selectionEnd ?? selectionStart;

      const applyInsertedText = (insertedText: string) => {
        setContent((prev) => insertTextAtSelection(prev, insertedText, selectionStart, selectionEnd));

        requestAnimationFrame(() => {
          const cursor = selectionStart + insertedText.length;
          textarea.focus();
          textarea.selectionStart = cursor;
          textarea.selectionEnd = cursor;
        });
      };

      if (preferredText) {
        applyInsertedText(preferredText);
        return;
      }

      try {
        const urls = await Promise.all(imageFiles.map((file) => handleImageUpload(file)));
        const markdown = urls.map((url) => `![](${url})`).join('\n');
        applyInsertedText(markdown);
      } catch (error) {
        console.error('Paste image upload failed:', error);
        alert('Image upload failed');
      }
    };

    const textareaIds = [`${INLINE_EDITOR_ID}_md`, `${FULLSCREEN_EDITOR_ID}_md`];
    const textareas = textareaIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLTextAreaElement => node instanceof HTMLTextAreaElement);

    textareas.forEach((textarea) => textarea.addEventListener('paste', handleEditorPaste));

    return () => {
      textareas.forEach((textarea) => textarea.removeEventListener('paste', handleEditorPaste));
    };
  }, [isEditing, isEditorFullscreen]);

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await PostsService.putPosts(post.id, { is_published: !post.isPublished });
      fetchPosts();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t !== '');

    try {
      if (editingId) {
        // Update existing
        await PostsService.putPosts(editingId, {
          title,
          excerpt,
          content,
          tags: tagArray,
          readTime: readTime || undefined,
        });
      } else {
        // Create new
        await PostsService.postPosts({
          title,
          excerpt,
          content,
          tags: tagArray,
          readTime: readTime || undefined,
        });
      }

      setIsEditing(false);
      setEditingId(null);
      resetForm();
      fetchPosts();
    } catch (err) {
      console.error('Failed to save post:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = async (post: BlogPost) => {
    // 通过 API 获取完整文章内容
    try {
      const res = await PostsService.getPosts1(post.id);
      if (res.data) {
        setEditingId(post.id);
        setTitle(res.data.title || '');
        setExcerpt(res.data.excerpt || '');
        setContent(res.data.content || '');
        setTags((res.data.tags || []).join(', '));
        setReadTime(res.data.readTime || '');
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
      alert('Failed to load post content');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setExcerpt('');
    setContent('');
    setTags('');
    setReadTime('');
  };

  const handleAutoGenerate = async () => {
    if (!content.trim()) return;

    setIsGenerating(true);
    try {
      // 并行调用生成 excerpt, tags 和 readtime
      const [excerptRes, tagsRes, readtimeRes] = await Promise.all([
        AiService.postAiExcerpt({ content }),
        AiService.postAiTags({ content }),
        AiService.postAiReadtime({ content })
      ]);

      if (excerptRes.data?.result) {
        setExcerpt(excerptRes.data.result);
      }
      if (tagsRes.data?.tags && tagsRes.data.tags.length > 0) {
        setTags(tagsRes.data.tags.join(', '));
      }
      if (readtimeRes.data?.result) {
        setReadTime(readtimeRes.data.result);
      }
    } catch (error) {
      console.error('Auto-generate failed:', error);
      alert('自动生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await PostsService.deletePosts(id);
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const handleReply = async (commentId: string) => {
    const text = replyText[commentId];
    if (!text?.trim()) return;

    setReplyingId(commentId);
    try {
      const res = await CommentsService.postCommentsReply(commentId, { content: text.trim() });
      if (res.data) {
        // 添加回复到评论列表
        const reply: Comment = {
          id: res.data.id || Date.now().toString(),
          author: res.data.author || 'Admin',
          content: res.data.content || text,
          timestamp: res.data.timestamp || 'Just now',
          role: 'admin',
          postId: comments.find(c => c.id === commentId)?.postId
        };
        setComments(prev => [reply, ...prev]);
        setReplyText(prev => ({...prev, [commentId]: ''}));
      }
    } catch (error) {
      console.error('Failed to reply:', error);
      alert('Failed to send reply');
    } finally {
      setReplyingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await CommentsService.deleteComments(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  // Auth loading state
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20">
      {/* Dashboard Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textLight flex items-center gap-3">
            <span className="text-primary">root@devlog</span>
            <span className="text-secondary">/admin</span>
          </h1>
          <p className="text-xs text-secondary font-mono mt-1">System Status: Operational • Uptime: 99.9%</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 font-mono">
              ● Live Mode
           </div>
           <button onClick={handleLogout} className="text-xs font-bold text-red-400 hover:text-red-300">
              Logout [{'->'}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`w-full text-left px-4 py-3 rounded font-mono text-sm transition-colors border ${activeTab === 'posts' ? 'bg-surface border-primary/50 text-textLight' : 'border-transparent hover:bg-surface/50 text-secondary'}`}
          >
            {'>'} Manage_Posts
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`w-full text-left px-4 py-3 rounded font-mono text-sm transition-colors border ${activeTab === 'comments' ? 'bg-surface border-primary/50 text-textLight' : 'border-transparent hover:bg-surface/50 text-secondary'}`}
          >
            {'>'} Comments_Stream
          </button>
           <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-4 py-3 rounded font-mono text-sm transition-colors border ${activeTab === 'settings' ? 'bg-surface border-primary/50 text-textLight' : 'border-transparent hover:bg-surface/50 text-secondary'}`}
          >
            {'>'} System_Settings
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 bg-surface/30 border border-border rounded-lg p-6 min-h-[500px]">

          {/* --- POSTS TAB --- */}
          {activeTab === 'posts' && (
            <div>
              {!isEditing ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-textLight">Repository</h2>
                    <button
                      onClick={() => { resetForm(); setIsEditing(true); }}
                      className="bg-primary hover:bg-blue-600 text-white text-xs px-4 py-2 rounded font-bold shadow-lg shadow-primary/20 transition-all"
                    >
                      + touch new_post.md
                    </button>
                  </div>

                  {postsLoading ? (
                    <div className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-sm text-secondary">Loading posts...</span>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-secondary uppercase bg-bg border-b border-border font-mono">
                            <tr>
                              <th className="px-4 py-3 min-w-[200px]">Title</th>
                              <th className="px-4 py-3 whitespace-nowrap">Status</th>
                              <th className="px-4 py-3 whitespace-nowrap">Date</th>
                              <th className="px-4 py-3 whitespace-nowrap">Tags</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(post => (
                              <tr key={post.id} className="border-b border-border hover:bg-surface/50 transition-colors group">
                                <td className="px-4 py-3 font-medium text-textLight max-w-[300px] truncate" title={post.title}>{post.title}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {post.isPublished ? (
                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-mono whitespace-nowrap">
                                      ● Published
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20 font-mono whitespace-nowrap">
                                      ○ Draft
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-secondary whitespace-nowrap">{post.date}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex gap-1 flex-nowrap">
                                    {post.tags.slice(0, 2).map(t => (
                                      <span key={t} className="text-[10px] bg-secondary/10 px-1.5 py-0.5 rounded text-secondary">{t}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => handleTogglePublish(post)}
                                    className={`text-xs font-mono opacity-70 hover:opacity-100 ${post.isPublished ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                                  >
                                    {post.isPublished ? 'unpublish' : 'publish'}
                                  </button>
                                  <span className="text-border">|</span>
                                  <button
                                    onClick={() => handleEditClick(post)}
                                    className="text-primary hover:text-blue-300 text-xs font-mono opacity-70 hover:opacity-100"
                                  >
                                    nano
                                  </button>
                                  <span className="text-border">|</span>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-red-400 hover:text-red-300 text-xs font-mono opacity-70 hover:opacity-100"
                                  >
                                    rm
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 分页组件 */}
                      {posts.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                          <div className="text-xs text-secondary font-mono">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, posts.length)} of {posts.length}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-xs font-mono border border-border rounded hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              ← prev
                            </button>
                            <span className="text-xs font-mono text-secondary px-2">
                              {currentPage} / {Math.ceil(posts.length / PAGE_SIZE)}
                            </span>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(Math.ceil(posts.length / PAGE_SIZE), p + 1))}
                              disabled={currentPage >= Math.ceil(posts.length / PAGE_SIZE)}
                              className="px-3 py-1 text-xs font-mono border border-border rounded hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              next →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                // EDIT / CREATE MODE
                <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                    <h2 className="text-lg font-bold text-textLight">
                      {editingId ? `Edit: ${title}` : 'New Entry'}
                    </h2>
                    <button onClick={handleCancelEdit} className="text-xs text-secondary hover:text-text">Cancel</button>
                  </div>
                  <form onSubmit={handleSavePost} className="space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-mono text-secondary mb-2">Title</label>
                          <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-bg border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-secondary mb-2">Read Time</label>
                          <input value={readTime} onChange={e => setReadTime(e.target.value)} className="w-full bg-bg border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none" placeholder="5 min" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-mono text-secondary mb-2">Tags (comma separated)</label>
                        <input required value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-bg border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none" placeholder="React, Tech, Life" />
                     </div>
                     <div>
                        <label className="block text-xs font-mono text-secondary mb-2">Excerpt</label>
                        <textarea required value={excerpt} onChange={e => setExcerpt(e.target.value)} className="w-full bg-bg border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none h-20" />
                     </div>
                     <div>
                        {!isEditorFullscreen && (
                           <>
                             <div className="flex items-center justify-between mb-2">
                               <label className="block text-xs font-mono text-secondary">Content (Markdown)</label>
                               <button
                                 type="button"
                                 onClick={() => setIsEditorFullscreen(true)}
                                 className="text-xs font-mono text-secondary hover:text-primary transition-colors flex items-center gap-1"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                 </svg>
                                 Fullscreen
                               </button>
                             </div>
                             <MdEditor
                               id={INLINE_EDITOR_ID}
                               value={content}
                               style={{ height: '400px' }}
                               renderHTML={renderEditorMarkdownPreview}
                               onChange={({ text }) => setContent(text)}
                               placeholder="# Hello World..."
                               config={{
                                 view: { menu: true, md: true, html: true },
                                 canView: { menu: true, md: true, html: true, fullScreen: false, hideMenu: true },
                                 allowPasteImage: false,
                                 onImageUpload: handleImageUpload,
                               }}
                             />
                           </>
                        )}

                        {isEditorFullscreen && ReactDOM.createPortal(
                          <div className="fixed inset-0 z-[9999] bg-bg p-4 flex flex-col animate-fade-in">
                             <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                               <div className="flex items-center gap-4">
                                 <h2 className="text-lg font-bold text-textLight">{title || 'Untitled Post'}</h2>
                                 <span className="text-xs font-mono text-secondary border border-border px-2 py-0.5 rounded">Editing Mode</span>
                               </div>
                               <div className="flex items-center gap-4">
                                 <button
                                   type="button"
                                   onClick={handleAutoGenerate}
                                   disabled={isGenerating}
                                   className="text-xs font-mono text-accent hover:text-green-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                                 >
                                   {isGenerating ? 'Generating...' : '✨ Auto-generate Metadata'}
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => setIsEditorFullscreen(false)}
                                   className="text-xs font-mono text-secondary hover:text-primary transition-colors flex items-center gap-1 bg-surface px-3 py-1.5 rounded border border-border"
                                 >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                   </svg>
                                   Exit Fullscreen (Esc)
                                 </button>
                               </div>
                             </div>
                             <MdEditor
                               id={FULLSCREEN_EDITOR_ID}
                               value={content}
                               style={{ height: '100%', flex: 1 }}
                               renderHTML={renderEditorMarkdownPreview}
                               onChange={({ text }) => setContent(text)}
                               placeholder="# Hello World..."
                               config={{
                                 view: { menu: true, md: true, html: true },
                                 canView: { menu: true, md: true, html: true, fullScreen: false, hideMenu: true },
                                 allowPasteImage: false,
                                 onImageUpload: handleImageUpload,
                               }}
                             />
                          </div>,
                          document.body
                        )}
                     </div>
                     <div className="flex justify-between items-center">
                        {content.trim() ? (
                          <button
                            type="button"
                            onClick={handleAutoGenerate}
                            disabled={isGenerating}
                            className="text-xs font-mono text-accent hover:text-green-300 border border-accent/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isGenerating ? (
                              <>
                                <span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin"></span>
                                Generating...
                              </>
                            ) : (
                              '✨ Auto-generate Metadata'
                            )}
                          </button>
                        ) : (
                          <div></div>
                        )}
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-primary text-white px-6 py-2 rounded text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Post'}
                        </button>
                     </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* --- COMMENTS TAB --- */}
          {activeTab === 'comments' && (
            <div>
               <h2 className="text-lg font-bold text-textLight mb-6">Moderation Queue</h2>

               {commentsLoading ? (
                 <div className="text-center py-12">
                   <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                   <span className="text-sm text-secondary">Loading comments...</span>
                 </div>
               ) : comments.length === 0 ? (
                 <div className="text-center py-12 text-secondary text-sm">
                   No comments yet.
                 </div>
               ) : (
                 <div className="space-y-6">
                    {comments.map(comment => (
                      <div key={comment.id} className="bg-bg border border-border p-4 rounded-lg">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-textLight text-sm">{comment.author}</span>
                               {comment.role === 'admin' && (
                                 <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">ADMIN</span>
                               )}
                               <span className="text-[10px] text-secondary font-mono">
                                 {comment.postTitle ? (
                                   <a
                                     href={`/?post=${comment.postId}`}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="hover:text-primary hover:underline transition-colors"
                                   >
                                     on "{comment.postTitle}"
                                   </a>
                                 ) : (
                                   `on Post #${comment.postId}`
                                 )}
                               </span>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="text-xs text-secondary">{comment.timestamp}</span>
                               <button
                                 onClick={() => handleDeleteComment(comment.id)}
                                 className="text-xs text-red-400 hover:text-red-300 font-mono"
                               >
                                 rm
                               </button>
                            </div>
                         </div>
                         <p className="text-sm text-text mb-4 font-light">{comment.content}</p>

                         <div className="bg-surface p-2 rounded border border-border flex gap-2">
                            <input
                              type="text"
                              value={replyText[comment.id] || ''}
                              onChange={(e) => setReplyText({...replyText, [comment.id]: e.target.value})}
                              placeholder="Type admin reply..."
                              className="flex-grow bg-transparent text-xs focus:outline-none text-textLight"
                            />
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={replyingId === comment.id}
                              className="text-xs text-primary font-bold hover:underline disabled:opacity-50"
                            >
                              {replyingId === comment.id ? 'Sending...' : 'Reply'}
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {/* --- SETTINGS TAB --- */}
           {activeTab === 'settings' && (
            <div>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-textLight">System Settings</h2>
                 <div className="flex gap-2">
                   <button
                     onClick={() => setSettings(defaultConfig)}
                     className="text-xs text-secondary hover:text-text font-mono"
                   >
                     Reset to Default
                   </button>
                   <button
                     onClick={() => setShowJsonPreview(!showJsonPreview)}
                     className="text-xs text-primary hover:text-blue-300 font-mono border border-primary/30 px-3 py-1.5 rounded"
                   >
                     {showJsonPreview ? 'Hide JSON' : 'Preview JSON'}
                   </button>
                   <button
                     onClick={() => {
                       navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                       alert('JSON copied to clipboard!');
                     }}
                     className="text-xs text-accent hover:text-green-300 font-mono border border-accent/30 px-3 py-1.5 rounded"
                   >
                     Copy JSON
                   </button>
                   <button
                     onClick={() => {
                       const json = JSON.stringify(settings, null, 2);
                       const blob = new Blob([json], { type: 'application/json' });
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = 'siteConfig.json';
                       a.click();
                       URL.revokeObjectURL(url);
                     }}
                     className="bg-primary hover:bg-blue-600 text-white text-xs px-4 py-2 rounded font-bold shadow-lg shadow-primary/20 transition-all"
                   >
                     Download JSON
                   </button>
                 </div>
               </div>
               <p className="text-sm text-secondary mb-6">Customize your blog settings. Export the JSON file and place it in <code className="text-accent bg-surface px-1 rounded">config/siteConfig.json</code> to apply changes.</p>

               {/* JSON Preview */}
               {showJsonPreview && (
                 <div className="mb-6 bg-bg border border-border rounded-lg overflow-hidden">
                   <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-highlight/30">
                     <span className="text-xs font-mono text-secondary">siteConfig.json</span>
                     <div className="flex space-x-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-green-400/50"></div>
                     </div>
                   </div>
                   <pre className="p-4 text-xs font-mono text-textLight overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                     {JSON.stringify(settings, null, 2)}
                   </pre>
                 </div>
               )}

               <div className="space-y-8">
                 {/* Site Settings */}
                 <div className="bg-bg border border-border rounded-lg p-4">
                   <h3 className="text-sm font-bold text-textLight mb-4 flex items-center gap-2">
                     <span className="text-primary">#</span> Site Info
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Title</label>
                       <input
                         value={settings.site.title}
                         onChange={(e) => setSettings({...settings, site: {...settings.site, title: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Subtitle</label>
                       <input
                         value={settings.site.subtitle}
                         onChange={(e) => setSettings({...settings, site: {...settings.site, subtitle: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                       />
                     </div>
                     <div className="col-span-2">
                       <label className="block text-xs font-mono text-secondary mb-1">Description</label>
                       <textarea
                         value={settings.site.description}
                         onChange={(e) => setSettings({...settings, site: {...settings.site, description: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none h-16"
                       />
                     </div>
                     <div className="col-span-2">
                       <label className="block text-xs font-mono text-secondary mb-1">Keywords (comma separated)</label>
                       <input
                         value={settings.site.keywords.join(', ')}
                         onChange={(e) => setSettings({...settings, site: {...settings.site, keywords: e.target.value.split(',').map(k => k.trim())}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                       />
                     </div>
                   </div>
                 </div>

                 {/* Author Settings */}
                 <div className="bg-bg border border-border rounded-lg p-4">
                   <h3 className="text-sm font-bold text-textLight mb-4 flex items-center gap-2">
                     <span className="text-primary">#</span> Author Info
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Name</label>
                       <input
                         value={settings.author.name}
                         onChange={(e) => setSettings({...settings, author: {...settings.author, name: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Email</label>
                       <input
                         value={settings.author.email}
                         onChange={(e) => setSettings({...settings, author: {...settings.author, email: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Location</label>
                       <input
                         value={settings.author.location}
                         onChange={(e) => setSettings({...settings, author: {...settings.author, location: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Avatar URL</label>
                       <input
                         value={settings.author.avatar}
                         onChange={(e) => setSettings({...settings, author: {...settings.author, avatar: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         placeholder="https://..."
                       />
                     </div>
                     <div className="col-span-2">
                       <label className="block text-xs font-mono text-secondary mb-1">Bio</label>
                       <textarea
                         value={settings.author.bio}
                         onChange={(e) => setSettings({...settings, author: {...settings.author, bio: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none h-16"
                       />
                     </div>
                   </div>
                 </div>

                 {/* Social Links */}
                 <div className="bg-bg border border-border rounded-lg p-4">
                   <h3 className="text-sm font-bold text-textLight mb-4 flex items-center gap-2">
                     <span className="text-primary">#</span> Social Links
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">GitHub</label>
                       <input
                         value={settings.social.github}
                         onChange={(e) => setSettings({...settings, social: {...settings.social, github: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         placeholder="https://github.com/..."
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Twitter</label>
                       <input
                         value={settings.social.twitter}
                         onChange={(e) => setSettings({...settings, social: {...settings.social, twitter: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         placeholder="https://twitter.com/..."
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">LinkedIn</label>
                       <input
                         value={settings.social.linkedin}
                         onChange={(e) => setSettings({...settings, social: {...settings.social, linkedin: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         placeholder="https://linkedin.com/in/..."
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Website</label>
                       <input
                         value={settings.social.website}
                         onChange={(e) => setSettings({...settings, social: {...settings.social, website: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         placeholder="https://..."
                       />
                     </div>
                   </div>
                 </div>

                 {/* Footer Settings */}
                 <div className="bg-bg border border-border rounded-lg p-4">
                   <h3 className="text-sm font-bold text-textLight mb-4 flex items-center gap-2">
                     <span className="text-primary">#</span> Footer
                   </h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Copyright Text</label>
                       <input
                         value={settings.footer.copyright}
                         onChange={(e) => setSettings({...settings, footer: {...settings.footer, copyright: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                       />
                     </div>
                     <div className="flex items-center gap-3">
                       <label className="text-xs font-mono text-secondary">Show "Powered by" badge</label>
                       <button
                         onClick={() => setSettings({...settings, footer: {...settings.footer, showPoweredBy: !settings.footer.showPoweredBy}})}
                         className={`w-10 h-5 rounded-full relative transition-colors ${settings.footer.showPoweredBy ? 'bg-primary' : 'bg-border'}`}
                       >
                         <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.footer.showPoweredBy ? 'right-0.5' : 'left-0.5'}`}></div>
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* About Page Settings */}
                 <div className="bg-bg border border-border rounded-lg p-4">
                   <h3 className="text-sm font-bold text-textLight mb-4 flex items-center gap-2">
                     <span className="text-primary">#</span> About Page
                   </h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-mono text-secondary mb-1">Headline</label>
                       <textarea
                         value={settings.about.headline}
                         onChange={(e) => setSettings({...settings, about: {...settings.about, headline: e.target.value}})}
                         className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none h-16"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Terminal Command</label>
                         <input
                           value={settings.about.terminalCommand?.command || ''}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, terminalCommand: {...(settings.about.terminalCommand || {args: ''}), command: e.target.value}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                           placeholder="whoami"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Arguments</label>
                         <input
                           value={settings.about.terminalCommand?.args || ''}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, terminalCommand: {...(settings.about.terminalCommand || {command: ''}), args: e.target.value}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                           placeholder="--verbose"
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Availability</label>
                         <input
                           value={settings.about.status.availability}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, status: {...settings.about.status, availability: e.target.value}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Coffee Level (%)</label>
                         <input
                           type="number"
                           min="0"
                           max="100"
                           value={settings.about.status.coffeeLevel}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, status: {...settings.about.status, coffeeLevel: parseInt(e.target.value) || 0}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Preferred Shell</label>
                         <input
                           value={settings.about.status.preferredShell}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, status: {...settings.about.status, preferredShell: e.target.value}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Contact Title</label>
                         <input
                           value={settings.about.contact.title}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, contact: {...settings.about.contact, title: e.target.value}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Contact Description</label>
                         <input
                           value={settings.about.contact.description}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, contact: {...settings.about.contact, description: e.target.value}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-mono text-secondary mb-1">Button Text</label>
                         <input
                           value={settings.about.contact.buttonText}
                           onChange={(e) => setSettings({...settings, about: {...settings.about, contact: {...settings.about.contact, buttonText: e.target.value}}})}
                           className="w-full bg-surface border border-border rounded p-2 text-textLight text-sm focus:border-primary outline-none"
                         />
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Tech Stack Settings */}
                 <div className="bg-bg border border-border rounded-lg p-4">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-textLight flex items-center gap-2">
                       <span className="text-primary">#</span> Tech Stack
                     </h3>
                     <button
                       onClick={() => setSettings({
                         ...settings,
                         about: {
                           ...settings.about,
                           techStack: [...settings.about.techStack, { category: 'New Category', items: [] }]
                         }
                       })}
                       className="text-xs text-primary hover:text-blue-300 font-mono"
                     >
                       + Add Category
                     </button>
                   </div>
                   <div className="space-y-4">
                     {settings.about.techStack.map((stack, idx) => (
                       <div key={idx} className="bg-surface/30 p-3 rounded border border-border">
                         <div className="flex justify-between items-center mb-2 gap-2">
                           <input
                             value={stack.category}
                             onChange={(e) => {
                               const newStack = [...settings.about.techStack];
                               newStack[idx] = { ...newStack[idx], category: e.target.value };
                               setSettings({...settings, about: {...settings.about, techStack: newStack}});
                             }}
                             className="bg-bg border border-border rounded p-1.5 text-textLight text-xs font-bold focus:border-primary outline-none flex-grow"
                             placeholder="Category Name"
                           />
                           <button
                             onClick={() => {
                               const newStack = settings.about.techStack.filter((_, i) => i !== idx);
                               setSettings({...settings, about: {...settings.about, techStack: newStack}});
                             }}
                             className="text-red-400 hover:text-red-300 text-xs px-2"
                           >
                             ×
                           </button>
                         </div>
                         <textarea
                           value={stack.items.join(', ')}
                           onChange={(e) => {
                             const newStack = [...settings.about.techStack];
                             newStack[idx] = { ...newStack[idx], items: e.target.value.split(',').map(s => s.trim()) };
                             setSettings({...settings, about: {...settings.about, techStack: newStack}});
                           }}
                           className="w-full bg-bg border border-border rounded p-2 text-textLight text-xs focus:border-primary outline-none h-16"
                           placeholder="Items (comma separated)"
                         />
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Experience Settings */}
                 <div className="bg-bg border border-border rounded-lg p-4">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-textLight flex items-center gap-2">
                       <span className="text-primary">#</span> Experience
                     </h3>
                     <button
                       onClick={() => setSettings({
                         ...settings,
                         about: {
                           ...settings.about,
                           experience: [...settings.about.experience, { role: 'New Role', company: 'Company', period: '2024', desc: 'Description...' }]
                         }
                       })}
                       className="text-xs text-primary hover:text-blue-300 font-mono"
                     >
                       + Add Job
                     </button>
                   </div>
                   <div className="space-y-4">
                     {settings.about.experience.map((exp, idx) => (
                       <div key={idx} className="bg-surface/30 p-3 rounded border border-border space-y-2">
                         <div className="flex justify-between items-start gap-2">
                           <div className="grid grid-cols-2 gap-2 flex-grow">
                             <input
                               value={exp.role}
                               onChange={(e) => {
                                 const newExp = [...settings.about.experience];
                                 newExp[idx] = { ...newExp[idx], role: e.target.value };
                                 setSettings({...settings, about: {...settings.about, experience: newExp}});
                               }}
                               className="bg-bg border border-border rounded p-1.5 text-textLight text-xs font-bold focus:border-primary outline-none"
                               placeholder="Role"
                             />
                             <input
                               value={exp.company}
                               onChange={(e) => {
                                 const newExp = [...settings.about.experience];
                                 newExp[idx] = { ...newExp[idx], company: e.target.value };
                                 setSettings({...settings, about: {...settings.about, experience: newExp}});
                               }}
                               className="bg-bg border border-border rounded p-1.5 text-textLight text-xs focus:border-primary outline-none"
                               placeholder="Company"
                             />
                             <input
                               value={exp.period}
                               onChange={(e) => {
                                 const newExp = [...settings.about.experience];
                                 newExp[idx] = { ...newExp[idx], period: e.target.value };
                                 setSettings({...settings, about: {...settings.about, experience: newExp}});
                               }}
                               className="bg-bg border border-border rounded p-1.5 text-textLight text-xs font-mono focus:border-primary outline-none"
                               placeholder="Period"
                             />
                           </div>
                           <button
                             onClick={() => {
                               const newExp = settings.about.experience.filter((_, i) => i !== idx);
                               setSettings({...settings, about: {...settings.about, experience: newExp}});
                             }}
                             className="text-red-400 hover:text-red-300 text-xs px-2 pt-1"
                           >
                             ×
                           </button>
                         </div>
                         <textarea
                           value={exp.desc}
                           onChange={(e) => {
                             const newExp = [...settings.about.experience];
                             newExp[idx] = { ...newExp[idx], desc: e.target.value };
                             setSettings({...settings, about: {...settings.about, experience: newExp}});
                           }}
                           className="w-full bg-bg border border-border rounded p-2 text-textLight text-xs focus:border-primary outline-none h-20"
                           placeholder="Job Description"
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
