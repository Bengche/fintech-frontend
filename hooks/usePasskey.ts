/**
 * usePasskey — WebAuthn / Passkey hook
 *
 * Handles the full biometric registration and authentication ceremonies
 * using the browser's native WebAuthn API and the Fonlok passkey backend.
 *
 * Encoding note:
 *   WebAuthn options from the server use base64url strings.
 *   The browser WebAuthn API requires ArrayBuffers / Uint8Arrays.
 *   This hook translates between the two without any external library.
 */

import { useState, useCallback, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// ── Base64URL utilities ───────────────────────────────────────────────────────

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlToUint8(b64url: string): Uint8Array<ArrayBuffer> {
  // Accept base64 or base64url
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const str = atob(padded);
  // Explicitly back with ArrayBuffer (not SharedArrayBuffer) so the type
  // satisfies BufferSource / ArrayBufferView<ArrayBuffer> as required by WebAuthn.
  const ab = new ArrayBuffer(str.length);
  const buf = new Uint8Array(ab);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf;
}

// ── Option parsers (server JSON → browser ArrayBuffer shapes) ─────────────────

interface RawRegistrationOptions {
  challenge: string;
  user: { id: string; name: string; displayName: string };
  excludeCredentials?: Array<{ id: string; transports?: string[] }>;
  [key: string]: unknown;
}

interface RawAuthOptions {
  challenge: string;
  allowCredentials?: Array<{ id: string; transports?: string[] }>;
  [key: string]: unknown;
}

function parseRegistrationOptions(
  opts: RawRegistrationOptions,
): PublicKeyCredentialCreationOptions {
  return {
    ...(opts as unknown as PublicKeyCredentialCreationOptions),
    challenge: b64urlToUint8(opts.challenge),
    user: {
      ...opts.user,
      id: b64urlToUint8(opts.user.id),
    },
    excludeCredentials: (opts.excludeCredentials ?? []).map((c) => ({
      id: b64urlToUint8(c.id),
      type: "public-key" as PublicKeyCredentialType,
      ...(c.transports
        ? { transports: c.transports as AuthenticatorTransport[] }
        : {}),
    })),
  };
}

function parseAuthOptions(
  opts: RawAuthOptions,
): PublicKeyCredentialRequestOptions {
  return {
    ...(opts as unknown as PublicKeyCredentialRequestOptions),
    challenge: b64urlToUint8(opts.challenge),
    allowCredentials: (opts.allowCredentials ?? []).map((c) => ({
      id: b64urlToUint8(c.id),
      type: "public-key" as PublicKeyCredentialType,
      ...(c.transports
        ? { transports: c.transports as AuthenticatorTransport[] }
        : {}),
    })),
  };
}

// ── Response serialisers (browser credential → JSON for the server) ───────────

function serializeRegistration(cred: PublicKeyCredential) {
  const r = cred.response as AuthenticatorAttestationResponse;
  return {
    id: cred.id,
    rawId: bufToB64url(cred.rawId),
    response: {
      clientDataJSON: bufToB64url(r.clientDataJSON),
      attestationObject: bufToB64url(r.attestationObject),
      transports: r.getTransports?.() ?? [],
    },
    authenticatorAttachment: cred.authenticatorAttachment,
    clientExtensionResults: cred.getClientExtensionResults(),
    type: cred.type,
  };
}

function serializeAuthentication(cred: PublicKeyCredential) {
  const r = cred.response as AuthenticatorAssertionResponse;
  return {
    id: cred.id,
    rawId: bufToB64url(cred.rawId),
    response: {
      clientDataJSON: bufToB64url(r.clientDataJSON),
      authenticatorData: bufToB64url(r.authenticatorData),
      signature: bufToB64url(r.signature),
      userHandle: r.userHandle ? bufToB64url(r.userHandle) : undefined,
    },
    authenticatorAttachment: cred.authenticatorAttachment,
    clientExtensionResults: cred.getClientExtensionResults(),
    type: cred.type,
  };
}

// ── Exported types ────────────────────────────────────────────────────────────

export interface PasskeyEntry {
  id: number;
  device_name: string | null;
  created_at: string;
}

export interface UsePasskeyReturn {
  // Is biometric authentication available on this device?
  isAvailable: boolean;
  // One-time check in progress
  checkingAvailability: boolean;

  // Registration
  registerPasskey: (deviceName?: string) => Promise<boolean>;
  registerLoading: boolean;
  registerError: string;
  registerSuccess: boolean;

  // Authentication (login)
  authenticateWithPasskey: () => Promise<{
    userId: number;
    username: string;
    token: string;
  } | null>;
  authLoading: boolean;
  authError: string;

  // Management
  passkeys: PasskeyEntry[];
  listLoading: boolean;
  refreshPasskeys: () => void;
  removePasskey: (id: number) => Promise<void>;
  removeLoading: number | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePasskey(): UsePasskeyReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [passkeys, setPasskeys] = useState<PasskeyEntry[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<number | null>(null);

  // ── Availability check ───────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        if (
          typeof window === "undefined" ||
          !window.PublicKeyCredential ||
          !navigator.credentials
        ) {
          return;
        }
        const available =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsAvailable(available);
      } catch {
        // Silently unavailable
      } finally {
        setCheckingAvailability(false);
      }
    };
    check();
  }, []);

  // ── Register a new passkey ───────────────────────────────────────────────
  const registerPasskey = useCallback(
    async (deviceName?: string): Promise<boolean> => {
      setRegisterLoading(true);
      setRegisterError("");
      setRegisterSuccess(false);
      try {
        // Step 1: Get challenge from server
        const { data: options } = await axios.post(
          `${API}/passkey/register-challenge`,
          {},
          { withCredentials: true, headers: authHeaders() },
        );

        // Step 2: Browser biometric prompt
        const credential = await navigator.credentials.create({
          publicKey: parseRegistrationOptions(options),
        });

        if (!credential) {
          throw new Error("Biometric registration was cancelled.");
        }

        // Step 3: Verify with server
        await axios.post(
          `${API}/passkey/register-verify`,
          {
            ...serializeRegistration(credential as PublicKeyCredential),
            deviceName: deviceName || guessDeviceName(),
          },
          { withCredentials: true, headers: authHeaders() },
        );

        setRegisterSuccess(true);
        // Mark this device as passkey-capable in localStorage
        localStorage.setItem("fonlok_has_passkey", "1");
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (err as Error)?.message ||
          "Biometric registration failed. Please try again.";
        // DOMException name "NotAllowedError" = user cancelled the prompt
        if ((err as DOMException)?.name === "NotAllowedError") {
          setRegisterError("Registration was cancelled.");
        } else {
          setRegisterError(msg);
        }
        return false;
      } finally {
        setRegisterLoading(false);
      }
    },
    [],
  );

  // ── Authenticate with passkey ─────────────────────────────────────────────
  const authenticateWithPasskey = useCallback(async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      // Step 1: Get challenge from server
      const { data: options } = await axios.post(
        `${API}/passkey/auth-challenge`,
        {},
        { withCredentials: true },
      );

      // Step 2: Browser biometric prompt (discoverable — no email needed)
      const credential = await navigator.credentials.get({
        publicKey: parseAuthOptions(options),
      });

      if (!credential) {
        throw new Error("Biometric sign-in was cancelled.");
      }

      // Step 3: Verify with server
      const { data } = await axios.post(
        `${API}/passkey/auth-verify`,
        serializeAuthentication(credential as PublicKeyCredential),
        { withCredentials: true },
      );

      return {
        userId: data.userId,
        username: data.username,
        token: data.token,
      };
    } catch (err: unknown) {
      if ((err as DOMException)?.name === "NotAllowedError") {
        setAuthError("Biometric sign-in was cancelled.");
      } else {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (err as Error)?.message ||
          "Biometric sign-in failed. Please use your password instead.";
        setAuthError(msg);
      }
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── List passkeys ─────────────────────────────────────────────────────────
  const refreshPasskeys = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await axios.get(`${API}/passkey/list`, {
        withCredentials: true,
        headers: authHeaders(),
      });
      setPasskeys(data.passkeys ?? []);
    } catch {
      // silently fail — settings page handles this state
    } finally {
      setListLoading(false);
    }
  }, []);

  // ── Remove a passkey ──────────────────────────────────────────────────────
  const removePasskey = useCallback(async (id: number) => {
    setRemoveLoading(id);
    try {
      await axios.delete(`${API}/passkey/${id}`, {
        withCredentials: true,
        headers: authHeaders(),
      });

      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      if (
        (
          await axios.get(`${API}/passkey/list`, {
            withCredentials: true,
            headers: authHeaders(),
          })
        ).data.passkeys.length === 0
      ) {
        localStorage.removeItem("fonlok_has_passkey");
      }
    } finally {
      setRemoveLoading(null);
    }
  }, []);

  return {
    isAvailable,
    checkingAvailability,
    registerPasskey,
    registerLoading,
    registerError,
    registerSuccess,
    authenticateWithPasskey,
    authLoading,
    authError,
    passkeys,
    listLoading,
    refreshPasskeys,
    removePasskey,
    removeLoading,
  };
}

// ── Device name helper ────────────────────────────────────────────────────────

function guessDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux device";
  return "This device";
}
