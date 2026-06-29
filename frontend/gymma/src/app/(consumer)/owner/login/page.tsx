"use client";

import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { loginWithGoogleForOwner } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "435105824000-92ln248vnfnudgkp8tdtvre2vrlnh7tq.apps.googleusercontent.com";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSuccess(cred: { credential?: string }) {
    if (!cred.credential) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogleForOwner(cred.credential);
      saveSession(result.accessToken, result.refreshToken, result.user);
      router.push("/owner/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed. Please contact support if you believe this is an error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Gymma Partner</h1>
            <p className="text-sm text-gray-500 m-0">Owner Portal Login</p>
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-600 leading-relaxed text-center">
              Please sign in with the Google account associated with your gym. 
            </p>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 text-red-600 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p className="m-0 leading-tight">{error}</p>
              </div>
            )}

            <div className="flex justify-center mt-2">
              {loading ? (
                <div className="h-11 flex items-center justify-center text-sm text-gray-500">
                  Verifying access…
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError("Google sign-in failed. Please try again.")}
                  useOneTap={false}
                  theme="outline"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                />
              )}
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Not a partner yet? <a href="/partner-with-us" className="text-blue-600 hover:underline">Request a demo</a>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
