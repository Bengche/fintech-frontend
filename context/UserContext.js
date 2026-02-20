"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import Axios from "axios";
import Cookies from "js-cookie";
Axios.defaults.withCredentials = true;

const AuthContext = createContext({
  user_id: null,
  setUser_id: (_val) => {},
  username: null,
  setUsername: (_val) => {},
  authLoading: true,
});

export const AuthProvider = ({ children }) => {
  const [user_id, setUser_id] = useState(null);
  const [username, setUsername] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Track the interceptor ID so we can eject it on unmount and avoid
  // registering it twice in React Strict Mode (which mounts twice in dev).
  const interceptorRef = useRef(null);

  useEffect(() => {
    // ── Global 401 interceptor ────────────────────────────────────────────
    // Every Axios response that comes back with HTTP 401 (expired or invalid
    // session) clears the user state and redirects to /login automatically,
    // regardless of which page or component triggered the request.
    if (interceptorRef.current === null) {
      interceptorRef.current = Axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error?.response?.status === 401) {
            // Do not redirect if the user is already on an auth page —
            // that would cause an infinite redirect loop.
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
              Cookies.remove("authToken");
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
            Authorization: `Bearer ${Cookies.get("authToken")}`,
          },
        });
        setUser_id(response.data.userId);
        setUsername(response.data.username || null);
      } catch (err) {
        // 401 is handled by the interceptor above.
        // Any other error leaves the user on the current page without crashing.
        if (err?.response?.status !== 401) {
          console.error("Could not restore session:", err?.message);
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
