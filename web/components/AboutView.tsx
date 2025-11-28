import React from 'react';
import { siteConfig } from '../config';

export const AboutView: React.FC = () => {
  const { about, author } = siteConfig;
  
  // 生成咖啡进度条
  const coffeeBar = () => {
    const filled = Math.round(about.status.coffeeLevel / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${about.status.coffeeLevel}%`;
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-textLight mb-4 flex items-center gap-3">
          <span className="text-primary">whoami</span> 
          <span className="text-secondary text-xl font-normal">--verbose</span>
        </h1>
        <p className="text-lg text-text font-light leading-relaxed max-w-2xl">
          {about.headline}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-12">
          
          {/* Stats Block */}
          <div className="bg-surface/30 border border-border rounded-lg p-6 font-mono text-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
             </div>
             <h2 className="text-primary font-bold mb-4 border-b border-border/50 pb-2">System Status</h2>
             <div className="space-y-2 text-text">
                <div className="flex justify-between"><span>Current Location:</span> <span className="text-textLight">{author.location || 'Unknown'}</span></div>
                <div className="flex justify-between"><span>Availability:</span> <span className="text-green-500">{about.status.availability}</span></div>
                <div className="flex justify-between"><span>Coffee Level:</span> <span className="text-yellow-500">{coffeeBar()}</span></div>
                <div className="flex justify-between"><span>Preferred Shell:</span> <span className="text-textLight">{about.status.preferredShell}</span></div>
             </div>
          </div>

          {/* Experience Section */}
          <section>
             <h2 className="text-2xl font-bold text-textLight mb-6 flex items-center gap-2">
                <span className="text-accent">./experience</span>
             </h2>
             <div className="space-y-8 border-l-2 border-border ml-3 pl-8 relative">
                {about.experience.map((job, idx) => (
                   <div key={idx} className="relative">
                      <div className="absolute -left-[39px] top-1.5 w-5 h-5 rounded-full border-4 border-bg bg-secondary"></div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                         <h3 className="text-lg font-bold text-textLight">{job.role}</h3>
                         <span className="font-mono text-xs text-secondary bg-surface px-2 py-1 rounded border border-border">{job.period}</span>
                      </div>
                      <div className="text-primary text-sm font-mono mb-2">@ {job.company}</div>
                      <p className="text-text font-light text-sm leading-relaxed">{job.desc}</p>
                   </div>
                ))}
             </div>
          </section>

        </div>

        {/* Sidebar Column */}
        <aside className="space-y-8">
           
           {/* Tech Stack */}
           <div>
              <h2 className="text-lg font-bold text-textLight mb-4 font-mono border-b border-border pb-2">
                 Tech_Stack.json
              </h2>
              <div className="space-y-6">
                 {about.techStack.map((stack) => (
                    <div key={stack.category}>
                       <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">{stack.category}</h4>
                       <div className="flex flex-wrap gap-2">
                          {stack.items.map(item => (
                             <span key={item} className="px-2 py-1 bg-surface text-xs text-textLight border border-border rounded hover:border-primary/50 hover:text-primary transition-colors cursor-default">
                                {item}
                             </span>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Contact */}
           <div className="bg-primary/5 border border-primary/20 rounded p-4">
              <h3 className="text-sm font-bold text-primary mb-2">{about.contact.title}</h3>
              <p className="text-xs text-text mb-4">{about.contact.description}</p>
              <button 
                onClick={() => author.email && (window.location.href = `mailto:${author.email}`)}
                className="w-full py-2 bg-primary text-white text-xs font-bold rounded shadow-lg shadow-primary/20 hover:bg-blue-600 transition-colors"
              >
                 {about.contact.buttonText}
              </button>
           </div>

        </aside>

      </div>
    </div>
  );
};
