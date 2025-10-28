import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, signup, loading } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const action = mode === "login" ? login(email, password) : signup(email, password, name);
    const res = await action;
    if (res.ok) {
      navigate("/");
    } else {
      setError(res.error || "Operation failed");
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p>Sign {mode === "login" ? "in" : "up"} to your analytics dashboard</p>
        {error && <div className="badge" style={{ borderColor: "var(--error)", color: "var(--error)" }}>{error}</div>}
        {mode === "signup" && (
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          >
            Switch to {mode === "login" ? "Signup" : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
