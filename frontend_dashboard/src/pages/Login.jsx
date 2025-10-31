import React, { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { trackLogin } from "../utils/activity";

/**
 * PUBLIC_INTERFACE
 * Login placeholder: instructs users to use the Clerk SignIn widget route.
 * Tracks login event when authenticated. No redirects here to avoid loops.
 */
export default function Login() {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      trackLogin();
    }
  }, [isSignedIn]);

  return (
    <div style={{ display: "grid", placeItems: "center", height: "60vh", color: "#6b7280" }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center" }}>
          Please sign in to continue
        </div>
        <div style={{ fontSize: 14, marginTop: 8, textAlign: "center" }}>
          Open the Sign In page from your authentication flow.
        </div>
      </div>
    </div>
  );
}
