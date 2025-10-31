import React from 'react';
import { applyTheme, getStoredTheme } from '../theme';
import { useUser } from '@clerk/clerk-react';

export default function Settings() {
  const { user } = useUser() || {};
  const [mode, setMode] = React.useState(getStoredTheme());

  React.useEffect(() => { applyTheme(mode); }, [mode]);

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    'guest@demo.test';

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        <div className="grid" style={{ gap: 8 }}>
          <div><strong>Name:</strong> {user?.fullName || user?.firstName || 'Guest'}</div>
          <div><strong>Email:</strong> {email}</div>
          <div><strong>User ID:</strong> {user?.id || '—'}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Appearance</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn" onClick={() => setMode('light')}>Light</button>
          <button className="btn secondary" onClick={() => setMode('dark')}>Dark</button>
          <span className="small" style={{ marginLeft: 8 }}>Current: {mode}</span>
        </div>
      </div>
    </div>
  );
}
