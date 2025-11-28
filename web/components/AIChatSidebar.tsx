import React, { useState, useRef, useMemo } from 'react';
import { aiChatStream } from '../services/api';
import MarkdownIt from 'markdown-it';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

interface AIChatSidebarProps {
  content: string;
  mode?: 'sidebar' | 'floating';
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ content, mode = 'floating' }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const streamIndexRef = useRef<number>(-1);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const question = chatInput;
    setChatInput('');
    
    setChatHistory(prev => [...prev, { role: 'user', text: question }]);
    setChatLoading(true);
    
    const prompt = `基于以下博客文章内容回答问题。

文章内容：
${content}

用户问题：${question}

请根据文章内容简洁明了地回答。`;
    
    setChatHistory(prev => {
      streamIndexRef.current = prev.length;
      return [...prev, { role: 'ai', text: '' }];
    });

    await aiChatStream(
      prompt,
      (chunk: string) => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          if (streamIndexRef.current >= 0 && newHistory[streamIndexRef.current]) {
            newHistory[streamIndexRef.current] = {
              ...newHistory[streamIndexRef.current],
              text: newHistory[streamIndexRef.current].text + chunk
            };
          }
          return newHistory;
        });
      },
      () => {
        setChatLoading(false);
        streamIndexRef.current = -1;
      },
      (error: string) => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          if (streamIndexRef.current >= 0 && newHistory[streamIndexRef.current]) {
            newHistory[streamIndexRef.current] = {
              ...newHistory[streamIndexRef.current],
              text: newHistory[streamIndexRef.current].text || `错误: ${error}`
            };
          }
          return newHistory;
        });
        setChatLoading(false);
        streamIndexRef.current = -1;
      }
    );
  };

  const chatContent = (
    <>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        <span className="text-sm font-bold text-textLight">Ask AI</span>
      </div>
      
      <div className="overflow-y-auto min-h-[100px] mb-4 space-y-3 pr-1 custom-scrollbar flex-shrink">
        {chatHistory.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-8">
            Ask anything about this article
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-2.5 rounded-lg text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-surface border border-border text-gray-300'
            }`}>
              {msg.role === 'user' ? (
                msg.text
              ) : msg.text ? (
                <div 
                  className="markdown-body markdown-body-sm"
                  dangerouslySetInnerHTML={{ __html: mdParser.render(msg.text) }}
                />
              ) : (
                chatLoading && <span className="inline-block w-2 h-4 bg-primary animate-pulse"></span>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleChatSubmit} className="relative">
        <input 
          type="text" 
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask a question..."
          className="w-full bg-bg border border-border rounded-lg p-2.5 text-sm text-textLight focus:border-primary focus:outline-none pr-10 placeholder-gray-600"
        />
        <button 
          type="submit"
          disabled={!chatInput.trim() || chatLoading}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </>
  );

  if (mode === 'sidebar') {
    return (
      <aside className="w-full max-h-[calc(100vh-150px)] bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col shadow-xl transition-all duration-300">
        {chatContent}
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 w-14 h-14 bg-primary text-bg rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Mobile Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg mx-4 mb-4 h-[70vh] bg-surface border border-border rounded-2xl p-4 flex flex-col animate-slide-up">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-textLight transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {chatContent}
          </div>
        </div>
      )}
    </>
  );
};
