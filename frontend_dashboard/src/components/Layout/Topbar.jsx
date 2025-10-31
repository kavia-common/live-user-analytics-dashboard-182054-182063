import React from 'react';
import { applyTheme, getStoredTheme } from '../../theme';
import { UserButton, useUser } from '@clerk/clerk-react';

export default function Topbar() {
  const { user } = useUser() || {};
  const [mode, setMode] = React.useState(getStoredTheme());

  React.useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-badge">UA</div>
        Live Analytics
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn ghost"
          onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          aria-label="Toggle theme"
        >
          {mode === 'dark' ? '🌙 Dark' : '🌤️ Light'}
        </button>
        {user ? (
          <UserButton appearance={{ elements: { userButtonBox: { background: 'transparent' } } }} />
        ) : (
          <div className="badge">Guest</div>
        )}
      </div>
    </div>
  );
}
