import React from 'react';

export const TerminalHero: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-16 mt-8 perspective-1000">
      <div className="bg-bg border border-border rounded-lg shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] hover:shadow-primary/20">
        {/* Terminal Header */}
        <div className="bg-surface px-4 py-2 flex items-center justify-between border-b border-border">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs text-gray-500 font-mono select-none">zsh — 80x24</div>
          <div className="w-4"></div> {/* Spacer for balance */}
        </div>
        
        {/* Terminal Body */}
        <div className="p-6 font-mono text-sm md:text-base space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-primary mr-2">➜</span>
            <span className="text-secondary mr-2">~</span>
            <span className="text-textLight typing-effect">whoami</span>
          </div>
          
          <div className="text-text pl-4 border-l-2 border-border ml-1">
            <p>Full Stack Engineer specialized in React, Node.js, and Cloud Architecture.</p>
            <p className="mt-2 text-gray-400">Building digital products with a focus on performance and developer experience.</p>
          </div>

          <div className="flex items-center">
             <span className="text-primary mr-2">➜</span>
             <span className="text-secondary mr-2">~</span>
             <span className="text-accent">cat current_focus.txt</span>
          </div>
           <div className="text-text pl-4 text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
             <div>* Svelte / React 19</div>
             <div>* GenAI Integration</div>
             <div>* Rust for Tooling</div>
             <div>* System Design</div>
           </div>

          <div className="flex items-center animate-pulse">
            <span className="text-primary mr-2">➜</span>
            <span className="text-secondary mr-2">~</span>
            <span className="w-2 h-4 bg-textLight block"></span>
          </div>
        </div>
      </div>
    </div>
  );
};