"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import { usePasskey } from "@/hooks/usePasskey";
import { haptic } from "@/hooks/useHaptic";
import { Fingerprint, Loader2 } from "lucide-react";

interface Props {
  /** Called after a successful biometric sign-in with server data */
  onSuccess?: (data: {
    userId: number;
    username: string;
    token: string;
  }) => void;
  /** Called if the ceremony fails */
  onError?: (message: string) => void;
  /** Override the CTA label */
  label?: string;
}

/**
 * Renders a biometric / passkey sign-in button only when the device has a
 * platform authenticator available (fingerprint, face ID, Windows Hello, …).
 * Returns null on unsupported browsers / desktop with no biometric hardware.
 */
export default function BiometricButton({ onSuccess, onError, label }: Props) {
  const { setUser_id, setUsername } = useAuth();
  const router = useRouter();
  const {
    isAvailable,
    checkingAvailability,
    authenticateWithPasskey,
    authLoading,
    authError,
  } = usePasskey();

  const [localError, setLocalError] = useState("");

  // Propagate hook errors to the parent if needed
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
      onError?.(authError);
    }
  }, [authError, onError]);

  // Hide entirely while checking or if unavailable
  if (checkingAvailability || !isAvailable) return null;

  const handleClick = async () => {
    haptic("medium");
    setLocalError("");
    const result = await authenticateWithPasskey();
    if (result) {
      setUser_id(result.userId);
      setUsername(result.username ?? null);
      if (result.token) localStorage.setItem("token", result.token);
      onSuccess?.(result);
      if (!onSuccess) router.push("/dashboard");
    }
  };

  return (
    <div>
      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          margin: "1.25rem 0",
          color: "var(--color-text-muted)",
          fontSize: "0.8125rem",
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background: "var(--color-border, #e2e8f0)",
          }}
        />
        <span>or</span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "var(--color-border, #e2e8f0)",
          }}
        />
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={authLoading}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-btn, 0.5rem)",
          border: "1.5px solid var(--color-primary)",
          background: "transparent",
          color: "var(--color-primary)",
          fontWeight: 600,
          fontSize: "0.9375rem",
          cursor: authLoading ? "default" : "pointer",
          transition: "background 0.15s, color 0.15s",
          opacity: authLoading ? 0.65 : 1,
        }}
        onMouseEnter={(e) => {
          if (!authLoading) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-primary)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--color-primary)";
        }}
        aria-label="Sign in with biometrics"
      >
        {authLoading ? (
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Fingerprint size={18} />
        )}
        {authLoading ? "Verifying…" : (label ?? "Sign in with biometrics")}
      </button>

      {localError && (
        <p
          style={{
            marginTop: "0.625rem",
            fontSize: "0.8125rem",
            color: "var(--color-danger, #dc2626)",
            textAlign: "center",
          }}
        >
          {localError}
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
