import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useAuthContext } from "../context/AuthContext";
import { trackPageView } from "../utils/activity";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import "./Users.css";

// PUBLIC_INTERFACE
export default function Users() {
  // Admin-only user management
  const { isAdmin, loading: authLoading } = useAuthContext();
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get(`/api/users?page=${page}&limit=20`);
      setData(res.data || { items: [], total: 0, page, limit: 20 });
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Track page view
    trackPageView("/users");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) fetchUsers(1);
  }, [isAdmin, authLoading]);

  const updateRole = async (id, role) => {
    try {
      await api.patch(`/api/users/${id}/role`, { role });
      fetchUsers(data.page);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to update role:", e);
    }
  };

  if (authLoading) {
    return (
      <div className="users">
        <Card padding="lg">
          <div className="users__loading">
            <span className="users__spinner" />
            <span>Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="users">
        <Card padding="lg">
          <div className="users__forbidden">
            <span className="users__forbidden-icon">🔒</span>
            <h3>Forbidden</h3>
            <p>You do not have permission to view this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="users">
      <header className="users__header">
        <div>
          <h1 className="users__title">Users</h1>
          <p className="users__subtitle">Manage user accounts and roles</p>
        </div>
        <Badge variant="info">{data.total} total users</Badge>
      </header>

      <Card padding="lg" gradient>
        {loading ? (
          <div className="users__loading">
            <span className="users__spinner" />
            <span>Loading users...</span>
          </div>
        ) : err ? (
          <div className="users__error">{err}</div>
        ) : (
          <>
            <div className="users__table-wrapper">
              <table className="table users__table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u._id || u.id || u.email}>
                      <td className="users__email">{u.email}</td>
                      <td>{u.name || "—"}</td>
                      <td>
                        <Badge variant={u.role === "admin" ? "primary" : "default"}>
                          {u.role || "user"}
                        </Badge>
                      </td>
                      <td className="users__date">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateRole(u._id || u.id, u.role === "admin" ? "user" : "admin")
                          }
                        >
                          Make {u.role === "admin" ? "User" : "Admin"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!data.items.length && (
                    <tr>
                      <td colSpan="5" className="users__empty">
                        <span>👥</span>
                        <span>No users found</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="users__pagination">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchUsers(Math.max(1, data.page - 1))}
                disabled={data.page <= 1}
              >
                ← Previous
              </Button>
              <Badge variant="default">
                Page {data.page} of {Math.ceil((data.total || 0) / (data.limit || 1)) || 1}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchUsers(data.page + 1)}
                disabled={(data.page * data.limit) >= data.total}
              >
                Next →
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
