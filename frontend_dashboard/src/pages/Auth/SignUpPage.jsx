import React from 'react';
import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="centered">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 12 }}>
          <div className="brand-badge">UA</div>
          Create your account
        </div>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
