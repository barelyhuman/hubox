import { useState } from 'react';
import { Github, ExternalLink } from 'lucide-react';

interface TokenSetupProps {
  onSubmit: (token: string) => void;
  loading: boolean;
  error: string | null;
}

export default function TokenSetup({ onSubmit, loading, error }: TokenSetupProps) {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onSubmit(token.trim());
    }
  };

  return (
    <div className="token-setup">
      <div className="token-setup-card">
        <div className="github-logo">
          <Github size={48} strokeWidth={1.5} />
        </div>
        
        <h1>Connect to GitHub</h1>
        <p className="token-setup-description">
          Enter your GitHub Personal Access Token to get started.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your GitHub Personal Access Token"
            className="token-input"
            disabled={loading}
          />
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <button type="submit" className="token-submit" disabled={loading || !token.trim()}>
            {loading ? 'Validating...' : 'Save Token'}
          </button>
        </form>
        
        <div className="token-help">
          <a 
            href="https://github.com/settings/tokens/new?description=Hubox&scopes=notifications"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }} />
            Create a new token
          </a>
        </div>
      </div>
    </div>
  );
}
