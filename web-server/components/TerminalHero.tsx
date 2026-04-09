import React from 'react';
import { siteConfig } from '@/lib/config';

export const TerminalHero: React.FC = () => {
  const { about, author } = siteConfig;
  const cmd = about.terminalCommand || { command: 'whoami', args: '' };
  
  // Extract key tech items for the focus section
  const backendTech = about.techStack.find(t => t.category === 'Backend')?.items.slice(0, 2) || [];
  const aiTech = about.techStack.find(t => t.category === 'Backend')?.items.filter(i => i.includes('AI') || i.includes('Chain')) || [];
  const focusItems = [
    `* ${backendTech.join(' / ')}`, 
    `* ${aiTech.join(' / ') || 'AI Agents'}`,
    '* System Design', 
    '* Tinkering'
  ];

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
          <div className="text-xs text-gray-500 font-mono select-none">{about.status.preferredShell} — 80x24</div>
          <div className="w-4"></div> {/* Spacer for balance */}
        </div>
        
        {/* Terminal Body */}
        <div className="p-6 font-mono text-sm md:text-base space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-primary mr-2">➜</span>
            <span className="text-secondary mr-2">~</span>
            <span className="text-textLight typing-effect">{cmd.command} {cmd.args}</span>
          </div>
          
          <div className="text-text pl-4 border-l-2 border-border ml-1">
            <p>{author.bio}</p>
            <p className="mt-2 text-gray-400">{about.headline}</p>
          </div>

          <div className="flex items-center">
             <span className="text-primary mr-2">➜</span>
             <span className="text-secondary mr-2">~</span>
             <span className="text-accent">cat current_focus.txt</span>
          </div>
           <div className="text-text pl-4 text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
             {focusItems.map((item, idx) => (
               <div key={idx}>{item}</div>
             ))}
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