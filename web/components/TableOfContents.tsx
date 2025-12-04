import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
  children?: TocItem[];
}

interface TableOfContentsProps {
  content: string;
}

// 生成基础 ID
const generateBaseId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 从 Markdown 内容解析标题
const parseHeadings = (content: string): TocItem[] => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  const idCounts: Record<string, number> = {}; // 跟踪重复 ID
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const baseId = generateBaseId(text);
    
    // 处理重复 ID：第一个不加后缀，后续的加 -1, -2, ...
    const count = idCounts[baseId] || 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;
    idCounts[baseId] = count + 1;
    
    headings.push({ id, text, level });
  }

  return headings;
};

// 构建嵌套的目录树
const buildTocTree = (headings: TocItem[]): TocItem[] => {
  if (headings.length === 0) return [];

  const result: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    const item: TocItem = { ...heading, children: [] };

    // 找到合适的父节点
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(item);
    } else {
      const parent = stack[stack.length - 1];
      parent.children!.push(item);
    }

    stack.push(item);
  }

  return result;
};

// 获取所有后代 ID
const getAllDescendantIds = (item: TocItem): string[] => {
  const ids: string[] = [];
  if (item.children) {
    for (const child of item.children) {
      ids.push(child.id);
      ids.push(...getAllDescendantIds(child));
    }
  }
  return ids;
};

// 递归渲染目录项
const TocItemComponent: React.FC<{
  item: TocItem;
  activeId: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onClick: (id: string) => void;
}> = ({ item, activeId, expandedIds, onToggle, onClick }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedIds.has(item.id);
  const isActive = activeId === item.id;
  
  // 检查是否有任何子项处于活跃状态
  const hasActiveChild = useMemo(() => {
    if (!hasChildren) return false;
    const allChildIds = getAllDescendantIds(item);
    return allChildIds.includes(activeId);
  }, [item, activeId, hasChildren]);

  return (
    <div className="relative">
      <div className="flex items-start gap-1">
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.id);
            }}
            className={`flex-shrink-0 w-4 h-4 mt-1 flex items-center justify-center rounded transition-all duration-200 hover:bg-primary/20 ${
              isExpanded || hasActiveChild ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform duration-200 ${isExpanded || hasActiveChild ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
        
        <button
          onClick={() => onClick(item.id)}
          className={`flex-1 text-left text-sm py-1 px-2 rounded transition-all duration-200 truncate ${
            !hasChildren ? 'ml-5' : ''
          } ${
            isActive
              ? 'text-primary bg-primary/10 font-medium'
              : hasActiveChild
              ? 'text-textLight'
              : 'text-gray-400 hover:text-textLight hover:bg-surface/50'
          }`}
          title={item.text}
        >
          {item.text}
        </button>
      </div>

      {/* 子项 */}
      {hasChildren && (
        <div
          className={`ml-4 pl-2 border-l border-border/50 overflow-hidden transition-all duration-300 ${
            isExpanded || hasActiveChild ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}
        >
          {item.children!.map((child) => (
            <TocItemComponent
              key={child.id}
              item={child}
              activeId={activeId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [activeId, setActiveId] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 解析标题
  const flatHeadings = useMemo(() => parseHeadings(content), [content]);
  const tocTree = useMemo(() => buildTocTree(flatHeadings), [flatHeadings]);

  // 获取指定 ID 的所有祖先 ID
  const getAncestorIds = useCallback((targetId: string): string[] => {
    const ancestors: string[] = [];
    
    const findAncestors = (items: TocItem[], path: string[]): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          ancestors.push(...path);
          return true;
        }
        if (item.children && item.children.length > 0) {
          if (findAncestors(item.children, [...path, item.id])) {
            return true;
          }
        }
      }
      return false;
    };

    findAncestors(tocTree, []);
    return ancestors;
  }, [tocTree]);

  // 更新活跃标题并展开祖先（只展开当前路径，其他折叠）
  const updateActiveHeading = useCallback((id: string) => {
    setActiveId(id);
    
    // 只展开当前标题的祖先路径，其他自动折叠
    const ancestors = getAncestorIds(id);
    setExpandedIds(new Set(ancestors));
  }, [getAncestorIds]);

  // 滚动监听 - 使用滚动事件检测当前可见标题
  useEffect(() => {
    if (flatHeadings.length === 0) return;

    let animationFrameId: number;

    const handleScroll = () => {
      // 使用 requestAnimationFrame 节流
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        const headingElements: HTMLElement[] = [];
        
        // 收集所有标题元素
        flatHeadings.forEach(({ id }) => {
          const el = document.getElementById(id);
          if (el) headingElements.push(el);
        });

        if (headingElements.length === 0) return;

        // 找到当前滚动位置对应的标题
        const scrollTop = window.scrollY;
        const offset = 120; // 导航栏高度 + 一些缓冲

        let currentHeading: HTMLElement | null = null;

        for (const el of headingElements) {
          const rect = el.getBoundingClientRect();
          const absoluteTop = rect.top + scrollTop;
          
          if (absoluteTop <= scrollTop + offset) {
            currentHeading = el;
          } else {
            break;
          }
        }

        // 如果没找到，使用第一个标题
        if (!currentHeading && headingElements.length > 0) {
          currentHeading = headingElements[0];
        }

        if (currentHeading && currentHeading.id) {
          updateActiveHeading(currentHeading.id);
        }
      });
    };

    // 延迟初始化，确保 DOM 已渲染
    const timeoutId = setTimeout(() => {
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [flatHeadings, updateActiveHeading]);

  // 点击导航
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
      updateActiveHeading(id);
    }
  }, [updateActiveHeading]);

  // 切换展开/折叠
  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (flatHeadings.length === 0) {
    return null;
  }

  return (
    <nav className="w-full">
      <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
        目录
      </div>
      
      <div className="space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {tocTree.map((item) => (
          <TocItemComponent
            key={item.id}
            item={item}
            activeId={activeId}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onClick={handleClick}
          />
        ))}
      </div>
    </nav>
  );
};
