"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import Axios from "axios";
import Cookies from "js-cookie";
Axios.defaults.withCredentials = true;

interface AuthContextValue {
  user_id: number | null;
  setUser_id: Dispatch<SetStateAction<number | null>>;
  username: string | null;
  setUsername: Dispatch<SetStateAction<string | null>>;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user_id: null,
  setUser_id: () => {},
  username: null,
  setUsername: () => {},
  authLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user_id, setUser_id] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Track the interceptor ID so we can eject it on unmount and avoid
  // registering it twice in React Strict Mode (which mounts twice in dev).
  const interceptorRef = useRef<number | null>(null);
  const reqInterceptorRef = useRef<number | null>(null);

  useEffect(() => {
    // ── Request interceptor: attach Bearer token to every Axios request ───
    // In production the frontend (Vercel) and backend (Railway) are on
    // different domains, so httpOnly cookies are unreliable cross-domain.
    // Sending the token via Authorization header works on all environments.
    if (reqInterceptorRef.current === null) {
      reqInterceptorRef.current = Axios.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "undefined" && token !== "null") {
          config.headers = config.headers || {};
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      });
    }

    return () => {
      if (reqInterceptorRef.current !== null) {
        Axios.interceptors.request.eject(reqInterceptorRef.current);
        reqInterceptorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // ── Global 401 interceptor ────────────────────────────────────────────
    if (interceptorRef.current === null) {
      interceptorRef.current = Axios.interceptors.response.use(
        (response) => response,
        (error) => {
          // ── Maintenance mode: redirect to /maintenance page ────────────
          if (
            error?.response?.status === 503 &&
            error?.response?.data?.maintenanceMode === true
          ) {
            if (!window.location.pathname.startsWith("/maintenance")) {
              window.location.href = "/maintenance";
            }
            return Promise.reject(error);
          }

          if (error?.response?.status === 401) {
            // Only redirect to /login when the user is on a page that
            // genuinely requires authentication. Public pages (homepage,
            // marketing pages, invoice view, etc.) should never redirect.
            const protectedPaths = [
              "/dashboard",
              "/purchases",
              "/settings",
              "/transactions",
              // /referral is the authenticated referral dashboard;
              // /referral-programme is the public marketing page.
              "/referral",
            ];
            const onProtectedPage = protectedPaths.some((p) =>
              window.location.pathname.startsWith(p),
            );
            // Exclude /referral-programme which starts with /referral
            const onPublicReferralPage = window.location.pathname.startsWith(
              "/referral-programme",
            );
            // Admin pages manage their own session entirely — the admin
            // dashboard's own useEffect calls /admin/verify and redirects
            // to /admin/login on failure. We must NOT interfere here or
            // the reloadUser call on every mount (including /admin/login)
            // will trigger an infinite redirect loop.
            const onAdminPage = window.location.pathname.startsWith("/admin");
            if (onProtectedPage && !onPublicReferralPage && !onAdminPage) {
              setUser_id(null);
              setUsername(null);
              Cookies.remove("authToken");
              localStorage.removeItem("token");
              window.location.href = "/login";
            }
          }
          return Promise.reject(error);
        },
      );
    }

    return () => {
      if (interceptorRef.current !== null) {
        Axios.interceptors.response.eject(interceptorRef.current);
        interceptorRef.current = null;
      }
    };
  }, []);

  // ── Restore session on page refresh ─────────────────────────────────────
  useEffect(() => {
    const reloadUser = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        const response = await Axios.get(`${baseUrl}/invoice/reload`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser_id(response.data.userId);
        setUsername(response.data.username || null);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status !== 401) {
          console.error("Could not restore session:", (err as Error)?.message);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    reloadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user_id, setUser_id, username, setUsername, authLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
