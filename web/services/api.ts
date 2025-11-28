/**
 * API Service - 配置和 SSE 流式请求
 */
import { OpenAPI, AiService } from '../api-client';
import { fetchEventSource } from '@microsoft/fetch-event-source';

// 配置 API 基础 URL（从环境变量读取）
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Token 管理
const TOKEN_KEY = 'devlog_token';

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  OpenAPI.TOKEN = token;
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  OpenAPI.TOKEN = undefined;
};

// 初始化 token
const savedToken = getToken();
if (savedToken) {
  OpenAPI.TOKEN = savedToken;
}

// ==================== AI 服务 ====================

export const summarizePost = async (content: string): Promise<string> => {
  try {
    const prompt = `请用3个简洁的要点总结以下技术博客文章，聚焦关键信息：\n\n${content}`;
    const res = await AiService.postAiChat({ message: prompt });
    return res.data?.result || "无法生成摘要。";
  } catch (error) {
    console.error("AI API Error:", error);
    throw new Error("内容摘要生成失败。");
  }
};

// ==================== SSE 流式请求 ====================

// 流式对话 - 使用 @microsoft/fetch-event-source 处理SSE
export const aiChatStream = async (
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) => {
  const ctrl = new AbortController();
  
  try {
    await fetchEventSource(`${OpenAPI.BASE}/ai/chat/stream`, {
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
        throw err; // 抛出错误以停止重试
      },
    });
  } catch (e: any) {
    // AbortError 是正常的关闭，不需要报错
    if (e.name !== 'AbortError') {
      onError(e.message || 'Stream error');
    }
  }
};
