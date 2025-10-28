import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?page=${page}&limit=20`);
      setData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const updateRole = async (id, role) => {
    await api.patch(`/users/${id}/role`, { role });
    fetchUsers(data.page);
  };

  if (!isAdmin) {
    return <div className="card"><h3>Users</h3><div className="badge">Forbidden: Admin only</div></div>;
  }

  return (
    <div className="card">
      <h3>Users</h3>
      {loading ? <div className="badge">Loading...</div> : (
        <table className="table">
          <thead>
            <tr><th>Email</th><th>Name</th><th>Role</th><th>Last login</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {data.items.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td><span className="badge">{u.role}</span></td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "-"}</td>
                <td>
                  <button className="btn ghost" onClick={() => updateRole(u.id, u.role === "admin" ? "user" : "admin")}>
                    Make {u.role === "admin" ? "User" : "Admin"}
                  </button>
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr><td colSpan="5"><div className="badge">No users</div></td></tr>
            )}
          </tbody>
        </table>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn ghost" onClick={() => fetchUsers(Math.max(1, data.page - 1))} disabled={data.page <= 1}>Prev</button>
        <div className="badge">Page {data.page}</div>
        <button className="btn ghost" onClick={() => fetchUsers(data.page + 1)} disabled={(data.page * data.limit) >= data.total}>Next</button>
      </div>
    </div>
  );
}
