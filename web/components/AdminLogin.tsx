import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError('Access Denied: Invalid Credentials');
        setPassword('');
      }
    } catch (err) {
      setError('Connection Error: Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-bg px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          </div>
          <div className="text-xs text-gray-500 font-mono">auth_service.exe</div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-textLight mb-2">System Access</h2>
            <p className="text-xs text-secondary font-mono">Restricted Area. Authorized Personnel Only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-secondary mb-2 font-mono">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-bg border border-border rounded p-3 text-textLight focus:border-primary focus:outline-none font-mono"
                placeholder="root"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-secondary mb-2 font-mono">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded p-3 text-textLight focus:border-primary focus:outline-none font-mono"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-mono flex items-center">
                <span className="mr-2">⚠</span> {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
               <button 
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 border border-border text-secondary hover:text-textLight rounded font-bold transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-primary text-white rounded font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Authenticating...' : 'Authenticate'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-3 bg-bg border-t border-border text-[10px] text-gray-500 font-mono text-center">
          IP: 127.0.0.1 • Connection: Secure
        </div>
      </div>
    </div>
  );
};