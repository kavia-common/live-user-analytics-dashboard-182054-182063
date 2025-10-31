import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiGet } from '../utils/apiClient';

const mockUsers = Array.from({ length: 8 }).map((_, i) => ({
  id: `u-${i}`,
  email: `user${i}@demo.test`,
  role: i % 3 === 0 ? 'admin' : 'member',
  lastActive: new Date(Date.now() - i * 1000 * 3600).toISOString(),
}));

function isAdmin(user) {
  const env = process.env.REACT_APP_ADMIN_EMAILS || '';
  const admins = env.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
  return email && admins.includes(email.toLowerCase());
}

export default function Users() {
  const { user, isSignedIn } = useUser() || {};
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const admin = isSignedIn && isAdmin(user);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiGet('/users');
        if (!cancelled) setRows(Array.isArray(res?.data) ? res.data : mockUsers);
      } catch {
        if (!cancelled) setRows(mockUsers);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (admin) load();
    else setLoading(false);
    return () => { cancelled = true; };
  }, [admin]);

  if (!admin) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div className="banner">Admin only. Add your email to REACT_APP_ADMIN_EMAILS to access.</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Users</h3>
      {loading ? (
        <div className="skeleton" style={{ width: '100%', height: 140 }} />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td><span className="badge">{u.role}</span></td>
                <td>{new Date(u.lastActive).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
