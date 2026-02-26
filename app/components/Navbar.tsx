"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import axios from "axios";
import NotificationBell from "./NotificationBell";
import FonlokLogo from "./FonlokLogo";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations, useLocale } from "next-intl";
import { haptic } from "@/hooks/useHaptic";
import { startTransition } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingBag,
  Gift,
  BadgeCheck,
  User,
  Settings,
  LogOut,
  Globe,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function Navbar() {
  const { user_id, setUser_id, username, setUsername } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Navbar");

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    startTransition(() => setMenuOpen(false));
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const locale = useLocale();
  const notifData = useNotifications();

  const switchLocale = () => {
    const other = locale === "en" ? "fr" : "en";
    document.cookie = `NEXT_LOCALE=${other};path=/;max-age=31536000`;
    window.location.reload();
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch { /* ignore */ }
    setUser_id(null);
    setUsername(null);
    localStorage.removeItem("token");
    router.push("/login");
  };

  const GlobeSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );

  return (
    <>
      {/* Drawer + backdrop animation keyframes */}
      <style>{`
        @keyframes nav-drawer-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes nav-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .nav-drawer-panel {
          animation: nav-drawer-in 0.27s cubic-bezier(0.32,0,0.18,1) forwards;
        }
        .nav-backdrop-overlay {
          animation: nav-backdrop-in 0.2s ease forwards;
        }
        .nav-mob-link {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.7rem 0.875rem;
          border-radius: 10px;
          color: rgba(255,255,255,0.82);
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.14s, color 0.14s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          box-sizing: border-box;
        }
        .nav-mob-link:hover { background: rgba(255,255,255,0.09); color: #fff; }
        .nav-mob-icon {
          display: flex; align-items: center; justify-content: center;
          width: 1.9rem; height: 1.9rem; border-radius: 8px;
          background: rgba(255,255,255,0.09); flex-shrink: 0;
          transition: background 0.14s;
        }
        .nav-mob-link:hover .nav-mob-icon { background: rgba(255,255,255,0.16); }
        .nav-mob-divider {
          height: 1px; background: rgba(255,255,255,0.09); margin: 0.375rem 0;
        }
      `}</style>

      {/* Spacer */}
      <div style={{ height: "62px", flexShrink: 0 }} aria-hidden="true" />

      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          transition: "background-color 0.38s ease, box-shadow 0.38s ease, border-color 0.38s ease",
          backgroundColor: scrolled ? "rgba(8,18,44,0.12)" : "var(--color-primary)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          boxShadow: scrolled ? "0 1px 0 rgba(255,255,255,0.08)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{
          maxWidth: "1200px", margin: "0 auto", padding: "0 1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: "62px", position: "relative",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }} aria-label="Fonlok home">
            <FonlokLogo variant="light" iconSize={30} />
          </Link>

          {/* Mobile-only centred notification bell */}
          {user_id && (
            <div className="flex md:hidden" style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-50%, -50%)", pointerEvents: "auto", zIndex: 1,
            }}>
              <NotificationBell notifications={notifData.notifications} unreadCount={notifData.unreadCount}
                markRead={notifData.markRead} markAllRead={notifData.markAllRead} />
            </div>
          )}

          {/* ── Desktop links ──────────────────────────────── */}
          <div style={{ alignItems: "center", gap: "0.25rem" }} className="hidden md:flex">
            {user_id ? (
              <>
                <NavLink href="/dashboard">{t("dashboard")}</NavLink>
                <NavLink href="/transactions">{t("transactions")}</NavLink>
                <NavLink href="/purchases">{t("myPurchases")}</NavLink>
                <NavLink href="/referral">{t("referral")}</NavLink>
                <NavLink href="/verify">Verify Receipt</NavLink>
                {username && <NavLink href={`/profile/${username}`}>{t("profile")}</NavLink>}
                <NavLink href="/settings">{t("settings")}</NavLink>
                <NotificationBell notifications={notifData.notifications} unreadCount={notifData.unreadCount}
                  markRead={notifData.markRead} markAllRead={notifData.markAllRead} />
                <button onClick={switchLocale}
                  aria-label={`Switch language – currently ${locale.toUpperCase()}`}
                  title={locale === "en" ? "Passer en français" : "Switch to English"}
                  style={{ display:"flex",alignItems:"center",gap:"0.35rem",padding:"0.32rem 0.75rem",
                    borderRadius:"999px",border:"1.5px solid rgba(255,255,255,0.22)",
                    background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.9)",
                    fontWeight:700,fontSize:"0.78rem",letterSpacing:"0.07em",cursor:"pointer",
                    transition:"border-color 0.15s,background 0.15s",whiteSpace:"nowrap" }}
                  onMouseEnter={(e)=>{ const b=e.currentTarget as HTMLButtonElement;
                    b.style.borderColor="rgba(255,255,255,0.55)";b.style.background="rgba(255,255,255,0.14)"; }}
                  onMouseLeave={(e)=>{ const b=e.currentTarget as HTMLButtonElement;
                    b.style.borderColor="rgba(255,255,255,0.22)";b.style.background="rgba(255,255,255,0.07)"; }}
                >{GlobeSVG}{locale === "en" ? "Français" : "English"}</button>
                <button onClick={handleLogout}
                  style={{ marginLeft:"0.75rem",padding:"0.45rem 1.1rem",borderRadius:"var(--radius-md)",
                    border:"1.5px solid rgba(255,255,255,0.25)",background:"transparent",
                    color:"rgba(255,255,255,0.8)",fontWeight:600,fontSize:"0.875rem",cursor:"pointer",
                    transition:"border-color 0.15s,color 0.15s" }}
                  onMouseEnter={(e)=>{ (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.6)";
                    (e.currentTarget as HTMLButtonElement).style.color="#fff"; }}
                  onMouseLeave={(e)=>{ (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.25)";
                    (e.currentTarget as HTMLButtonElement).style.color="rgba(255,255,255,0.8)"; }}
                >{t("logOut")}</button>
              </>
            ) : (
              <>
                <NavLink href="/verify">Verify Receipt</NavLink>
                <NavLink href="/login">{t("signIn")}</NavLink>
                <Link href="/register" style={{ marginLeft:"0.5rem",padding:"0.45rem 1.25rem",
                  borderRadius:"var(--radius-md)",background:"var(--color-accent)",
                  color:"var(--color-primary)",fontWeight:700,fontSize:"0.875rem",textDecoration:"none" }}>
                  {t("getStarted")}
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile right controls ──────────────────────── */}
          <div className="flex md:hidden" style={{ alignItems:"center",gap:"0.25rem" }}>
            {/* Hamburger / X */}
            <button
              onClick={() => { haptic("soft"); setMenuOpen((v) => !v); }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              style={{ background: menuOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
                border:"1.5px solid rgba(255,255,255,0.18)",borderRadius:"9px",cursor:"pointer",
                padding:"0.45rem",display:"flex",alignItems:"center",justifyContent:"center",
                transition:"background 0.18s",width:"38px",height:"38px" }}
            >
              {menuOpen
                ? <X size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
                : (
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
                    <rect y="0" width="18" height="2" rx="1" fill="rgba(255,255,255,0.85)" />
                    <rect y="6" width="13" height="2" rx="1" fill="rgba(255,255,255,0.85)" />
                    <rect y="12" width="18" height="2" rx="1" fill="rgba(255,255,255,0.85)" />
                  </svg>
                )
              }
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-in drawer ─────────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden" style={{ position:"fixed",inset:0,zIndex:49 }}>
          {/* Backdrop */}
          <div
            className="nav-backdrop-overlay"
            onClick={() => setMenuOpen(false)}
            style={{ position:"absolute",inset:0,background:"rgba(4,10,25,0.65)",
              backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)" } as React.CSSProperties}
          />

          {/* Panel */}
          <div
            ref={drawerRef}
            className="nav-drawer-panel"
            style={{ position:"absolute",top:0,right:0,bottom:0,
              width:"min(82vw,320px)",
              background:"linear-gradient(168deg,#0d1e42 0%,#091526 100%)",
              boxShadow:"-8px 0 40px rgba(0,0,0,0.5)",
              display:"flex",flexDirection:"column",overflowY:"auto",overflowX:"hidden" }}
          >
            {/* Panel header */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"1rem 1.125rem",borderBottom:"1px solid rgba(255,255,255,0.09)",flexShrink:0 }}>
              <Link href="/" onClick={() => setMenuOpen(false)} style={{ textDecoration:"none" }}>
                <FonlokLogo variant="light" iconSize={26} />
              </Link>

            </div>

            {/* Links */}
            <div style={{ flex:1,padding:"0.625rem 0.875rem" }}>
              {user_id ? (
                <>
                  {/* User identity */}
                  {username && (
                    <div style={{ display:"flex",alignItems:"center",gap:"0.75rem",
                      padding:"0.75rem 0.875rem",marginBottom:"0.25rem",
                      borderRadius:"10px",background:"rgba(255,255,255,0.06)" }}>
                      <div style={{ width:"2.25rem",height:"2.25rem",borderRadius:"50%",
                        background:"linear-gradient(135deg,var(--color-accent) 0%,#f59e0b 100%)",
                        color:"var(--color-primary)",display:"flex",alignItems:"center",
                        justifyContent:"center",fontWeight:800,fontSize:"1rem",flexShrink:0 }}>
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ margin:0,fontWeight:700,fontSize:"0.875rem",color:"#fff",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{username}</p>
                        <p style={{ margin:0,fontSize:"0.72rem",color:"rgba(255,255,255,0.4)" }}>@{username}</p>
                      </div>
                    </div>
                  )}

                  <div className="nav-mob-divider" />

                  <MobItem href="/dashboard" icon={<LayoutDashboard size={15} strokeWidth={2} />}>{t("dashboard")}</MobItem>
                  <MobItem href="/transactions" icon={<ArrowLeftRight size={15} strokeWidth={2} />}>{t("transactions")}</MobItem>
                  <MobItem href="/purchases" icon={<ShoppingBag size={15} strokeWidth={2} />}>{t("myPurchases")}</MobItem>
                  <MobItem href="/referral" icon={<Gift size={15} strokeWidth={2} />}>{t("referral")}</MobItem>
                  <MobItem href="/verify" icon={<BadgeCheck size={15} strokeWidth={2} />}>Verify Receipt</MobItem>
                  {username && <MobItem href={`/profile/${username}`} icon={<User size={15} strokeWidth={2} />}>{t("profile")}</MobItem>}
                  <MobItem href="/settings" icon={<Settings size={15} strokeWidth={2} />}>{t("settings")}</MobItem>

                  <div className="nav-mob-divider" />

                  {/* Language */}
                  <button className="nav-mob-link"
                    onClick={() => { switchLocale(); setMenuOpen(false); }}>
                    <span className="nav-mob-icon"><Globe size={15} strokeWidth={2} color="rgba(255,255,255,0.8)" /></span>
                    {locale === "en" ? "English → Français" : "Français → English"}
                  </button>

                  {/* Logout */}
                  <button className="nav-mob-link" onClick={handleLogout}
                    style={{ color:"rgba(255,110,110,0.9)" } as React.CSSProperties}>
                    <span className="nav-mob-icon" style={{ background:"rgba(255,80,80,0.13)" }}>
                      <LogOut size={15} strokeWidth={2} color="rgba(255,110,110,0.9)" />
                    </span>
                    {t("logOut")}
                  </button>
                </>
              ) : (
                <>
                  <MobItem href="/verify" icon={<BadgeCheck size={15} strokeWidth={2} />}>Verify Receipt</MobItem>
                  <div className="nav-mob-divider" />
                  <MobItem href="/login" icon={<LogIn size={15} strokeWidth={2} />}>{t("signIn")}</MobItem>
                  {/* Get Started CTA */}
                  <Link href="/register" onClick={() => setMenuOpen(false)}
                    style={{ display:"flex",alignItems:"center",gap:"0.875rem",
                      padding:"0.7rem 0.875rem",borderRadius:"10px",
                      background:"var(--color-accent)",color:"var(--color-primary)",
                      fontSize:"0.9375rem",fontWeight:700,textDecoration:"none",marginTop:"0.25rem" }}>
                    <span style={{ display:"flex",alignItems:"center",justifyContent:"center",
                      width:"1.9rem",height:"1.9rem",borderRadius:"8px",
                      background:"rgba(255,255,255,0.25)",flexShrink:0 }}>
                      <UserPlus size={15} strokeWidth={2} />
                    </span>
                    {t("getStarted")}
                  </Link>
                </>
              )}
            </div>

            {/* Panel footer */}
            <div style={{ padding:"0.875rem 1.125rem",borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0 }}>
              <p style={{ margin:0,fontSize:"0.68rem",color:"rgba(255,255,255,0.22)",
                textAlign:"center",letterSpacing:"0.04em" }}>
                © {new Date().getFullYear()} Fonlok · Secure Escrow
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Desktop NavLink ──────────────────────────────────────────────────────────
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      style={{ padding:"0.4rem 0.85rem",borderRadius:"var(--radius-sm)",
        color:"rgba(255,255,255,0.75)",fontWeight:500,fontSize:"0.9rem",
        textDecoration:"none",transition:"color 0.15s,background-color 0.15s" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)";
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
      }}
    >{children}</Link>
  );
}

// ── Mobile drawer item ───────────────────────────────────────────────────────
function MobItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-mob-link">
      <span className="nav-mob-icon">{icon}</span>
      {children}
    </Link>
  );
}
