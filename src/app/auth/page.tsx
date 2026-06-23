"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Activity, ShieldCheck, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please try again.");
      setSigningIn(false);
    }
  };

  if (loading || (user && !signingIn)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          <p className="text-sm font-medium text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-slate-900" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            CivicPulse Citizen Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to report hyperlocal issues and track municipal resolutions.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-6 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-800 rounded p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-red-800 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons / Input */}
        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="w-full flex items-center justify-center space-x-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-slate-700"></div>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.355-2.846-6.355-6.355s2.846-6.356 6.355-6.356c1.626 0 3.033.621 4.095 1.631l3.118-3.118C19.14 2.215 15.932 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c5.78 0 10.748-4.148 10.748-11.24 0-.648-.052-1.32-.155-1.955H12.24Z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer notices */}
        <div className="mt-8 border-t border-slate-100 pt-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span>Secure single sign-on powered by Firebase Auth.</span>
        </div>
      </div>
    </div>
  );
}
