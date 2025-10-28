import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { trackLogin } from "../utils/activity";

/**
 * Legacy Login component preserved to avoid broken imports.
 * Redirects to Clerk SignIn route and tracks login when authenticated.
 */
export default function Login() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    // Track login event when user successfully signs in
    if (isSignedIn) {
      trackLogin();
    }
  }, [isSignedIn]);

  useEffect(() => {
    navigate("/sign-in", { replace: true });
  }, [navigate]);

  return null;
}
