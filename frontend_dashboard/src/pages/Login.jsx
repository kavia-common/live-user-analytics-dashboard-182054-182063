import React from "react";
import { SignIn } from "@clerk/clerk-react";

/**
 * PUBLIC_INTERFACE
 * Login page rendering Clerk's SignIn component centered on the page.
 * This page is accessible to unauthenticated users and will be gated by routing.
 */
export default function Login() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(243,244,246,1))",
        padding: "2rem",
      }}
    >
      <div
        style={{
          padding: "1rem",
          borderRadius: "16px",
          backdropFilter: "blur(8px)",
        }}
      >
        <SignIn routing="path" path="/login" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
