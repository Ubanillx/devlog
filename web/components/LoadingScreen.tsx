import React, { useEffect, useState } from 'react';

export const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  useEffect(() => {
    const sequence = [
      { text: '> Initializing kernel...', delay: 200 },
      { text: '> Loading standard libraries...', delay: 800 },
      { text: '> Mounting file system...', delay: 1500 },
      { text: '> Starting user interface...', delay: 2200 },
      { text: '> Access granted.', delay: 2800 },
    ];

    let timeouts: NodeJS.Timeout[] = [];

    sequence.forEach(({ text, delay }) => {
      const timeout = setTimeout(() => {
        setLines(prev => [...prev, text]);
      }, delay);
      timeouts.push(timeout);
    });

    // Start fade out
    const fadeTimeout = setTimeout(() => {
      setIsFadingOut(true);
    }, 3500);
    timeouts.push(fadeTimeout);

    // Complete after fade out
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 4000); // 3500 + 500ms transition
    timeouts.push(completeTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-bg flex items-center justify-center font-mono text-sm md:text-base text-text transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-lg p-8">
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={index} className="flex items-center gap-2 animate-fade-in">
              <span className="text-primary">➜</span>
              <span className={index === lines.length - 1 ? 'text-textLight' : 'text-secondary'}>
                {line.substring(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 h-6">
          <div className="w-3 h-5 bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
