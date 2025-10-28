import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Legacy Login component preserved to avoid broken imports.
 * Redirects to Clerk SignIn route.
 */
export default function Login() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/sign-in", { replace: true });
  }, [navigate]);
  return null;
}
