import { BlogPost } from './types';
import './api'; // Ensure OpenAPI.BASE is initialized
import { PostsService } from '../api-client';

// 将后端响应映射为前端 BlogPost 类型
export const mapPostResponse = (post: any): BlogPost => ({
  id: post.id,
  title: post.title,
  date: post.date || post.publishedDate || new Date().toISOString().split('T')[0],
  tags: post.tags || [],
  excerpt: post.excerpt,
  aiSummary: post.aiSummary ?? post.ai_summary ?? null,
  content: post.content || '',
  readTime: post.readTime || post.read_time || '1 min',
  viewCount: post.viewCount ?? 0,
  isPublished: post.isPublished ?? post.is_published ?? false,
});

// 服务端获取文章列表
export async function getPosts(page: number = 1, pageSize: number = 10) {
  const res = await PostsService.getPosts(page, pageSize);
  const posts: BlogPost[] = (res.data?.posts as any[])?.map(mapPostResponse) || [];
  return {
    posts,
    page: res.data?.page || 1,
    totalPages: res.data?.totalPages || 1,
    total: res.data?.total || 0,
  };
}

// 服务端获取单篇文章
export async function getPost(id: string) {
  const res = await PostsService.getPosts1(id);
  return mapPostResponse(res.data);
}
