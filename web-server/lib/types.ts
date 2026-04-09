export interface BlogPost {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
  readTime: string;
  viewCount?: number;
  isPublished?: boolean;
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
  postTitle?: string;
  parentId?: string;
  replies?: Comment[];
}
