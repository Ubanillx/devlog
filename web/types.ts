export interface BlogPost {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string; // Markdown-like content
  readTime: string;
  viewCount?: number; // 阅读人数
  isPublished?: boolean; // 发布状态
}

export interface AIResponse {
  text: string;
  loading: boolean;
  error?: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  role: 'guest' | 'admin';
  postId?: string;
  parentId?: string;
  replies?: Comment[];
}

export enum ViewState {
  HOME = 'HOME',
  POST = 'POST',
  ABOUT = 'ABOUT',
  LOGIN = 'LOGIN',
  ADMIN = 'ADMIN'
}