import React, { useState, useMemo, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { TerminalHero } from './components/TerminalHero';
import { PostCard } from './components/PostCard';
import { PostView } from './components/PostView';
import { AboutView } from './components/AboutView';
import { ThemeToggle } from './components/ThemeToggle';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogPost, ViewState } from './types';
import { siteConfig } from './config';
import { PostsService, AuthService } from './api-client';
import { getToken, setToken, clearToken } from './services/api';

// 将后端响应映射为前端 BlogPost 类型
const mapPostResponse = (post: any): BlogPost => ({
  id: post.id,
  title: post.title,
  date: post.date || post.publishedDate || new Date().toISOString().split('T')[0],
  tags: post.tags || [],
  excerpt: post.excerpt,
  content: post.content || '',
  readTime: post.readTime || post.read_time || '1 min',
  viewCount: post.viewCount ?? 0,
  isPublished: post.isPublished ?? post.is_published ?? false,
});

// Icons
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Lifted State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载文章列表
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        // 检查是否已登录
        const token = getToken();
        if (token) {
          const userRes = await AuthService.getAuthMe();
          if (userRes.data) {
            setIsLoggedIn(true);
            // 管理员加载所有文章
            const res = await PostsService.getAdminPosts(1, 100, 'all');
            setPosts(res.data?.posts?.map(mapPostResponse) || []);
          } else {
            // Token 无效，清除并加载公开文章
            clearToken();
            const res = await PostsService.getPosts(1, 100);
            setPosts(res.data?.posts?.map(mapPostResponse) || []);
          }
        } else {
          // 游客只加载已发布文章
          const res = await PostsService.getPosts(1, 100);
          setPosts(res.data?.posts?.map(mapPostResponse) || []);
        }
      } catch (e) {
        console.error('Failed to load posts:', e);
        // 出错时加载公开文章
        const res = await PostsService.getPosts(1, 100);
        setPosts(res.data?.posts?.map(mapPostResponse) || []);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  
  // Navigation Handlers
  const navigateToPost = (id: string) => {
    setSelectedPostId(id);
    setViewState(ViewState.POST);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
    window.history.pushState(null, '', `?post=${id}`);
  };

  const navigateHome = () => {
    setViewState(ViewState.HOME);
    setSelectedPostId(null);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
    window.history.pushState(null, '', '/');
  };

  const navigateToAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewState(ViewState.ABOUT);
    setSelectedPostId(null);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
    window.history.pushState(null, '', '?view=about');
  };

  const navigateToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      setViewState(ViewState.ADMIN);
    } else {
      setViewState(ViewState.LOGIN);
    }
  };

  useEffect(() => {
    const applyFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const post = params.get('post');
      const view = params.get('view');
      if (post) {
        setSelectedPostId(post);
        setViewState(ViewState.POST);
      } else if (view === 'about') {
        setViewState(ViewState.ABOUT);
        setSelectedPostId(null);
      } else {
        setViewState(ViewState.HOME);
        setSelectedPostId(null);
      }
    };
    applyFromLocation();
    const onPop = () => applyFromLocation();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Admin Actions
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await AuthService.postAuthLogin({ username, password });
      if (res.data?.token) {
        setToken(res.data.token);
        setIsLoggedIn(true);
        setViewState(ViewState.ADMIN);
        // 管理员加载所有文章（包括草稿）
        const postsRes = await PostsService.getAdminPosts(1, 100, 'all');
        setPosts(postsRes.data?.posts?.map(mapPostResponse) || []);
        return true;
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
    return false;
  };

  const handleLogout = async () => {
    clearToken();
    setIsLoggedIn(false);
    // 游客只能看已发布文章
    const res = await PostsService.getPosts(1, 100);
    setPosts(res.data?.posts?.map(mapPostResponse) || []);
    navigateHome();
  };

  const handleAddPost = async (postData: { title: string; excerpt: string; content: string; tags: string[]; readTime?: string }) => {
    const res = await PostsService.postPosts(postData);
    if (res.data) {
      setPosts([mapPostResponse(res.data), ...posts]);
    }
  };

  const handleUpdatePost = async (id: string, postData: { title?: string; excerpt?: string; content?: string; tags?: string[]; readTime?: string; is_published?: boolean }) => {
    const res = await PostsService.putPosts(id, postData);
    if (res.data) {
      const updatedPost = mapPostResponse(res.data);
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await PostsService.deletePosts(id);
        setPosts(posts.filter(p => p.id !== id));
      } catch (e) {
        console.error('Failed to delete post:', e);
      }
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    const res = await PostsService.putPosts(id, { is_published: isPublished });
    if (res.data) {
      const updatedPost = mapPostResponse(res.data);
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-text selection:bg-primary/30 selection:text-textLight transition-colors duration-300 relative z-10">
      {showIntro && <LoadingScreen onComplete={() => setShowIntro(false)} />}
      <BackgroundCanvas />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 nav-blur border-b border-border/50 dark:border-border transition-all duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={navigateHome} 
            className="font-bold text-xl tracking-tight cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="text-primary">{`{`}</span>
            <span className="text-textLight">UbanillxのDevLog</span>
            <span className="text-primary">{`}`}</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex items-center gap-6">
              <a href="#" onClick={(e) => {e.preventDefault(); navigateHome();}} className={`text-sm transition-colors ${viewState === ViewState.HOME ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}>/home</a>
              <a href="#" onClick={navigateToAbout} className={`text-sm transition-colors ${viewState === ViewState.ABOUT ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}>/about</a>
              <div className="h-4 w-px bg-border/60"></div>
            </div>

            <div className="flex items-center gap-3">
              {siteConfig.social.github && (
                <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-textLight transition-colors">
                  <GitHubIcon />
                </a>
              )}
              {siteConfig.social.twitter && (
                <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <TwitterIcon />
                </a>
              )}
            </div>
            <div className="h-4 w-px bg-border/60 hidden sm:block"></div>
            <ThemeToggle />
            
            {/* Mobile Menu Button */}
            <button 
              className="sm:hidden text-gray-400 hover:text-textLight transition-colors p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-border/50 bg-bg/95 backdrop-blur-xl animate-slide-up">
            <div className="px-6 py-4 flex flex-col gap-4">
              <a 
                href="#" 
                onClick={(e) => {e.preventDefault(); navigateHome();}} 
                className={`text-base py-2 transition-colors border-b border-border/30 ${viewState === ViewState.HOME ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}
              >
                /home
              </a>
              <a 
                href="#" 
                onClick={navigateToAbout} 
                className={`text-base py-2 transition-colors border-b border-border/30 ${viewState === ViewState.ABOUT ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}
              >
                /about
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow px-6 py-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          
          {viewState === ViewState.HOME && (
            <div className="animate-in fade-in duration-500">
              <TerminalHero />
              
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-textLight flex items-center gap-2">
                    <span className="text-primary">ls</span> 
                    <span className="text-gray-500">-lat</span> 
                    posts/
                  </h2>
                  <span className="text-xs text-gray-500 border border-gray-700 rounded px-2 py-1 bg-bg">
                    {posts.length} items
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {isLoading ? (
                    <div className="text-center py-20 text-secondary font-mono">
                      <div className="animate-pulse">Loading posts...</div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-secondary font-mono">
                      Directory is empty.
                    </div>
                  ) : (
                    posts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        onClick={navigateToPost} 
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {viewState === ViewState.POST && selectedPostId && (
            <PostView postId={selectedPostId} onBack={navigateHome} />
          )}
          
          {viewState === ViewState.ABOUT && (
            <AboutView />
          )}
          
          {viewState === ViewState.LOGIN && (
             <AdminLogin onLogin={handleLogin} onCancel={navigateHome} />
          )}

          {viewState === ViewState.ADMIN && isLoggedIn && (
             <AdminDashboard 
                posts={posts} 
                onAddPost={handleAddPost} 
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                onTogglePublish={handleTogglePublish}
                onLogout={handleLogout} 
              />
          )}
          
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 dark:border-border py-8 mt-auto transition-all duration-300 bg-bg/60 backdrop-blur-xl relative z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-mono">
          <div className="mb-4 md:mb-0">
            {siteConfig.footer.copyright}
          </div>
          <div className="flex items-center space-x-4">
            <a href="/rss.xml" className="hover:text-textLight" target="_blank" rel="noopener noreferrer">RSS</a>
            <a href="/sitemap.xml" className="hover:text-textLight" target="_blank" rel="noopener noreferrer">Sitemap</a>
            
            {/* Secret Admin Link */}
            <a href="#" onClick={navigateToLogin} className="hover:text-primary flex items-center gap-1 group transition-colors">
              <LockIcon />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Admin</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
