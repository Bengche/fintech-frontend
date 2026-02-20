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

  useEffect(() => {
    // ── Global 401 interceptor ────────────────────────────────────────────
    if (interceptorRef.current === null) {
      interceptorRef.current = Axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error?.response?.status === 401) {
            const authPaths = [
              "/login",
              "/forgot-password",
              "/reset-password",
              "/register",
            ];
            const onAuthPage = authPaths.some((p) =>
              window.location.pathname.startsWith(p),
            );
            if (!onAuthPage) {
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
