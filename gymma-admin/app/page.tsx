"use client";

import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSuccess(cred: { credential?: string }) {
    if (!cred.credential) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle(cred.credential);
      saveSession(result.accessToken, result.refreshToken, result.user);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed. Make sure your account has admin access.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        {/* Background gradient */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(124,110,242,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: "420px",
          display: "flex", flexDirection: "column", gap: "32px",
          alignItems: "center",
        }}>
          {/* Logo + label */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "14px",
              background: "linear-gradient(135deg, var(--accent), #5b4bd1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={28} color="#fff" />
            </div>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Gymma Admin
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 4 }}>
                Internal portal · Founders only
              </p>
            </div>
          </div>

          {/* Card */}
          <div style={{
            width: "100%", background: "var(--bg-1)",
            border: "1px solid var(--border)", borderRadius: "20px",
            padding: "32px", display: "flex", flexDirection: "column", gap: "20px",
          }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                Sign in to continue
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Only authorised Gymma admin accounts can access this portal. Sign in with your designated Google account.
              </p>
            </div>

            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px", padding: "12px 14px",
              }}>
                <AlertCircle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: "13px", color: "var(--red)", margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center" }}>
              {loading ? (
                <div style={{
                  height: 44, display: "flex", alignItems: "center",
                  color: "var(--text-muted)", fontSize: "13px",
                }}>
                  Verifying access…
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError("Google sign-in failed. Please try again.")}
                  useOneTap={false}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="signin_with"
                  logo_alignment="left"
                />
              )}
            </div>
          </div>

          <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
            This portal is not publicly accessible. If you need access, contact a super admin.
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
