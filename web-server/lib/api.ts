/**
 * API Service - 配置和 SSE 流式请求
 * 适配 Next.js 环境（服务端和客户端通用）
 */
import { OpenAPI, AiService } from '../api-client';
import { fetchEventSource } from '@microsoft/fetch-event-source';

// 配置 API 基础 URL
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer 
  ? process.env.NEXT_INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:8080/api/v1' 
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

OpenAPI.BASE = API_BASE_URL;

// Token 管理
const TOKEN_KEY = 'devlog_token';

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
  OpenAPI.TOKEN = token;
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
  OpenAPI.TOKEN = undefined;
};

// ==================== AI 服务 ====================

export const generatePostSummary = async (postId: string, force = false): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ force }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload?.message || payload?.error || '内容摘要生成失败。';
    throw new Error(message);
  }

  return payload?.data?.result || '无法生成摘要。';
};

// ==================== SSE 流式请求 ====================

export const aiChatStream = async (
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) => {
  const ctrl = new AbortController();

  try {
    await fetchEventSource(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OpenAPI.TOKEN ? { 'Authorization': `Bearer ${OpenAPI.TOKEN}` } : {}),
      },
      body: JSON.stringify({ message }),
      signal: ctrl.signal,

      onmessage(event) {
        if (event.data === '[DONE]') {
          ctrl.abort();
          onDone();
          return;
        }
        onChunk(event.data);
      },

      onclose() {
        onDone();
      },

      onerror(err) {
        onError(err?.message || 'Stream error');
        throw err;
      },
    });
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      onError(e.message || 'Stream error');
    }
  }
};
