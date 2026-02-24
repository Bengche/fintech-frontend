"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Axios from "axios";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ── Confetti particle ────────────────────────────────────────────────────────
type Particle = {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: "circle" | "square" | "triangle";
};

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

function makeParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 2,
    shape: (["circle", "square", "triangle"] as const)[i % 3],
  }));
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PaymentPendingPage() {
  const { invoice_number } = useParams<{ invoice_number: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const buyerEmail = searchParams.get("email") || "";

  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const [particles] = useState<Particle[]>(() => makeParticles(40));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dots, setDots] = useState(".");

  // Animated dots for "Waiting..." text
  useEffect(() => {
    if (status !== "pending") return;
    const t = setInterval(
      () => setDots((d) => (d.length >= 3 ? "." : d + ".")),
      500,
    );
    return () => clearInterval(t);
  }, [status]);

  // Poll payment status every 4 s
  // Uses the dedicated poll endpoint which checks Campay directly if the DB
  // still shows pending — so this works even when the Campay webhook can't
  // reach the server (e.g. ngrok URL changed between restart).
  useEffect(() => {
    if (!invoice_number) return;

    const check = async () => {
      try {
        const res = await Axios.get(`${API}/payment/poll/${invoice_number}`);
        const s = res.data?.status;
        if (s === "paid" || s === "delivered" || s === "completed") {
          setStatus("paid");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // silently ignore — keep polling
      }
    };

    check();
    intervalRef.current = setInterval(check, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [invoice_number]);

  const isPaid = status === "paid";

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes phonePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50%       { box-shadow: 0 0 0 18px rgba(59,130,246,0); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes spinIn {
          from { transform: rotate(-180deg) scale(0); opacity:0; }
          to   { transform: rotate(0deg) scale(1); opacity:1; }
        }
        @keyframes shimmer {
          0%,100% { opacity:0.5; }
          50%      { opacity:1; }
        }
        @keyframes blink {
          0%,90%,100% { transform: scaleY(1); }
          95%          { transform: scaleY(0.08); }
        }
        @keyframes heartPop {
          0%   { transform: scale(0) translateY(0); opacity:1; }
          60%  { transform: scale(1.3) translateY(-10px); opacity:1; }
          100% { transform: scale(1) translateY(-22px); opacity:0; }
        }
        .character-wrap { animation: float 3.2s ease-in-out infinite; }
        .phone-glow { animation: phonePulse 2s ease-in-out infinite; }
        .pop-in { animation: popIn 0.5s cubic-bezier(.175,.885,.32,1.275) forwards; }
        .spin-in { animation: spinIn 0.6s cubic-bezier(.175,.885,.32,1.275) 0.15s both; }
        .shimmer { animation: shimmer 1.8s ease-in-out infinite; }
        .eye-blink { animation: blink 4s ease-in-out infinite; transform-origin: center; }
        .heart-pop { animation: heartPop 1.2s ease-out 0.4s both; }
      `}</style>

      {/* Confetti layer */}
      {isPaid && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: 0,
                width: p.size,
                height: p.size,
                backgroundColor:
                  p.shape === "triangle" ? "transparent" : p.color,
                borderRadius: p.shape === "circle" ? "50%" : "2px",
                borderLeft:
                  p.shape === "triangle"
                    ? `${p.size / 2}px solid transparent`
                    : undefined,
                borderRight:
                  p.shape === "triangle"
                    ? `${p.size / 2}px solid transparent`
                    : undefined,
                borderBottom:
                  p.shape === "triangle"
                    ? `${p.size}px solid ${p.color}`
                    : undefined,
                animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isPaid ? "#f0fdf4" : "#eff6ff",
          padding: "2rem 1.25rem",
          transition: "background-color 0.8s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: isPaid
              ? "rgba(16,185,129,0.08)"
              : "rgba(59,130,246,0.08)",
            transition: "background 0.8s",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: isPaid
              ? "rgba(16,185,129,0.05)"
              : "rgba(99,102,241,0.06)",
            transition: "background 0.8s",
          }}
        />

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: isPaid
              ? "0 20px 60px rgba(16,185,129,0.15)"
              : "0 20px 60px rgba(59,130,246,0.12)",
            padding: "2.5rem 2rem",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
            transition: "box-shadow 0.8s ease",
          }}
        >
          {/* Character illustration */}
          <div
            className="character-wrap"
            style={{ marginBottom: "1.5rem", display: "inline-block" }}
          >
            <svg
              width="200"
              height="240"
              viewBox="0 0 200 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ── Ground shadow ── */}
              <ellipse
                cx="100"
                cy="234"
                rx="54"
                ry="7"
                fill="rgba(0,0,0,0.08)"
              />

              {/* ── SHOES ── */}
              <ellipse
                cx="76"
                cy="226"
                rx="20"
                ry="9"
                fill={isPaid ? "#047857" : "#1d4ed8"}
                style={{ transition: "fill 0.6s" }}
              />
              <ellipse
                cx="72"
                cy="221"
                rx="16"
                ry="8"
                fill={isPaid ? "#059669" : "#2563EB"}
                style={{ transition: "fill 0.6s" }}
              />
              <ellipse
                cx="124"
                cy="226"
                rx="20"
                ry="9"
                fill={isPaid ? "#047857" : "#1d4ed8"}
                style={{ transition: "fill 0.6s" }}
              />
              <ellipse
                cx="128"
                cy="221"
                rx="16"
                ry="8"
                fill={isPaid ? "#059669" : "#2563EB"}
                style={{ transition: "fill 0.6s" }}
              />

              {/* ── LEGS ── */}
              <path
                d="M80,174 Q76,196 74,218"
                stroke={isPaid ? "#059669" : "#2563EB"}
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />
              <path
                d="M120,174 Q124,196 126,218"
                stroke={isPaid ? "#059669" : "#2563EB"}
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />

              {/* ── BODY ── */}
              <path
                d="M62,112 Q58,138 61,166 Q72,178 100,178 Q128,178 139,166 Q142,138 138,112 Q126,106 100,106 Q74,106 62,112 Z"
                fill={isPaid ? "#10B981" : "#3B82F6"}
                style={{ transition: "fill 0.6s" }}
              />
              {/* Shirt waist line */}
              <path
                d="M72,160 Q100,164 128,160"
                stroke={isPaid ? "#059669" : "#2563EB"}
                strokeWidth="1.5"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />
              {/* Shirt pocket */}
              <rect
                x="106"
                y="124"
                width="14"
                height="11"
                rx="2.5"
                fill={isPaid ? "#059669" : "#2563EB"}
                style={{ transition: "fill 0.6s" }}
              />
              <rect
                x="108"
                y="122"
                width="10"
                height="3"
                rx="1.5"
                fill={isPaid ? "#047857" : "#1d4ed8"}
                style={{ transition: "fill 0.6s" }}
              />

              {/* ── UPPER ARMS ── */}
              <path
                d="M66,118 Q44,124 36,144"
                stroke={isPaid ? "#059669" : "#2563EB"}
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />
              <path
                d="M134,118 Q156,124 164,144"
                stroke={isPaid ? "#059669" : "#2563EB"}
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />

              {/* ── FOREARMS ── */}
              <path
                d="M36,144 Q38,165 64,174"
                stroke={isPaid ? "#10B981" : "#3B82F6"}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />
              <path
                d="M164,144 Q162,165 136,174"
                stroke={isPaid ? "#10B981" : "#3B82F6"}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />

              {/* ── PHONE ── */}
              {/* Drop shadow */}
              <rect
                x="70"
                y="122"
                width="60"
                height="94"
                rx="12"
                fill="rgba(0,0,0,0.14)"
                transform="translate(2,4)"
              />
              {/* Body */}
              <rect
                x="70"
                y="118"
                width="60"
                height="94"
                rx="12"
                fill="#111827"
              />
              {/* Screen */}
              <rect
                x="74"
                y="124"
                width="52"
                height="82"
                rx="8"
                fill={isPaid ? "#d1fae5" : "#dbeafe"}
                style={{ transition: "fill 0.6s" }}
              />
              {/* Notch */}
              <rect
                x="89"
                y="120"
                width="22"
                height="5"
                rx="2.5"
                fill="#1f2937"
              />
              <circle cx="106" cy="122.5" r="2.2" fill="#374151" />
              {/* Side volume buttons */}
              <rect
                x="130"
                y="134"
                width="3"
                height="11"
                rx="1.5"
                fill="#374151"
              />
              <rect
                x="130"
                y="150"
                width="3"
                height="8"
                rx="1.5"
                fill="#374151"
              />
              {/* Power button */}
              <rect
                x="67"
                y="138"
                width="3"
                height="14"
                rx="1.5"
                fill="#374151"
              />

              {/* Fonlok label */}
              <text
                x="100"
                y="144"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                fontWeight="800"
                fontSize="9"
                fill={isPaid ? "#065f46" : "#1e40af"}
                style={{ transition: "fill 0.6s" }}
              >
                Fonlok
              </text>
              {/* Logo circle */}
              <circle
                cx="100"
                cy="164"
                r="14"
                fill={isPaid ? "#10B981" : "#3B82F6"}
                style={{ transition: "fill 0.6s" }}
              />
              <text
                x="100"
                y="169"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                fontWeight="900"
                fontSize="14"
                fill="#ffffff"
              >
                F
              </text>

              {/* Checkmark when paid */}
              {isPaid && (
                <polyline
                  points="88,186 95,193 114,174"
                  stroke="#065f46"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                  style={{ animation: "checkDraw 0.5s ease 0.3s forwards" }}
                />
              )}
              {/* Loading dots when pending */}
              {!isPaid && (
                <>
                  <circle
                    cx="90"
                    cy="188"
                    r="4.5"
                    fill="#93c5fd"
                    className="shimmer"
                  />
                  <circle
                    cx="100"
                    cy="188"
                    r="4.5"
                    fill="#93c5fd"
                    className="shimmer"
                    style={{ animationDelay: "0.35s" }}
                  />
                  <circle
                    cx="110"
                    cy="188"
                    r="4.5"
                    fill="#93c5fd"
                    className="shimmer"
                    style={{ animationDelay: "0.7s" }}
                  />
                </>
              )}

              {/* ── HANDS (cute stubby fingers) ── */}
              {/* Left hand palm */}
              <circle cx="64" cy="174" r="12" fill="#FFD4A3" />
              {/* Left fingers */}
              <circle cx="55" cy="166" r="6" fill="#FFD4A3" />
              <circle cx="61" cy="162" r="6" fill="#FFD4A3" />
              <circle cx="68" cy="161" r="6" fill="#FFD4A3" />
              <circle cx="75" cy="163" r="5.5" fill="#FFD4A3" />
              {/* Left thumb */}
              <circle cx="53" cy="174" r="5.5" fill="#FFD4A3" />
              {/* Knuckle lines */}
              <path
                d="M55,167 Q58,164 61,163"
                stroke="rgba(200,130,90,0.3)"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M61,163 Q64,160 68,162"
                stroke="rgba(200,130,90,0.3)"
                strokeWidth="1.2"
                fill="none"
              />

              {/* Right hand palm */}
              <circle cx="136" cy="174" r="12" fill="#FFD4A3" />
              {/* Right fingers */}
              <circle cx="145" cy="166" r="6" fill="#FFD4A3" />
              <circle cx="139" cy="162" r="6" fill="#FFD4A3" />
              <circle cx="132" cy="161" r="6" fill="#FFD4A3" />
              <circle cx="125" cy="163" r="5.5" fill="#FFD4A3" />
              {/* Right thumb */}
              <circle cx="147" cy="174" r="5.5" fill="#FFD4A3" />
              {/* Knuckle lines */}
              <path
                d="M145,167 Q142,164 139,163"
                stroke="rgba(200,130,90,0.3)"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M139,163 Q136,160 132,162"
                stroke="rgba(200,130,90,0.3)"
                strokeWidth="1.2"
                fill="none"
              />

              {/* ── NECK ── */}
              <rect
                x="90"
                y="98"
                width="20"
                height="13"
                rx="6"
                fill="#FFD4A3"
              />

              {/* ── COLLAR ── */}
              <path
                d="M90,109 Q95,116 100,110 Q105,116 110,109"
                stroke={isPaid ? "#047857" : "#1e40af"}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "stroke 0.6s" }}
              />

              {/* ── EARS (behind head) ── */}
              <circle cx="62" cy="76" r="11" fill="#FFD4A3" />
              <circle cx="62" cy="76" r="6.5" fill="#f0a070" />
              <circle cx="138" cy="76" r="11" fill="#FFD4A3" />
              <circle cx="138" cy="76" r="6.5" fill="#f0a070" />

              {/* ── HEAD ── */}
              <circle cx="100" cy="72" r="38" fill="#FFD4A3" />

              {/* ── HAIR ── */}
              {/* Base back hair */}
              <ellipse cx="100" cy="44" rx="36" ry="20" fill="#1e1b4b" />
              {/* Left side hair sweep */}
              <path d="M64,78 Q60,52 74,40 Q84,33 100,37" fill="#1e1b4b" />
              {/* Right side hair sweep */}
              <path d="M136,78 Q140,52 126,40 Q116,33 100,37" fill="#1e1b4b" />
              {/* Forehead coverage */}
              <rect x="66" y="42" width="68" height="24" fill="#1e1b4b" />
              {/* Hair shine streak */}
              <path
                d="M92,38 Q94,30 100,36"
                stroke="#4f46e5"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.45"
              />
              {/* Cute ahoge strand on top */}
              <path
                d="M100,37 Q106,20 99,10 Q97,4 102,3 Q107,2 103,14 Q101,24 100,37"
                fill="#1e1b4b"
              />
              {/* Side bang fringe left */}
              <path
                d="M69,62 Q64,54 68,50"
                stroke="#1e1b4b"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Side bang fringe right */}
              <path
                d="M131,50 Q136,54 131,62"
                stroke="#1e1b4b"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />

              {/* ── FACE ── */}

              {/* Rosy cheeks */}
              <ellipse
                cx="77"
                cy="83"
                rx="12"
                ry="8"
                fill="rgba(251,113,133,0.22)"
              />
              <ellipse
                cx="123"
                cy="83"
                rx="12"
                ry="8"
                fill="rgba(251,113,133,0.22)"
              />

              {/* Eyebrows */}
              <path
                d="M82,60 Q88,56 94,59"
                stroke="#1e1b4b"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M106,59 Q112,56 118,60"
                stroke="#1e1b4b"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Eyes */}
              {isPaid ? (
                <>
                  {/* Happy squint arcs */}
                  <path
                    d="M82,73 Q88,67 94,73"
                    stroke="#1e1b4b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M106,73 Q112,67 118,73"
                    stroke="#1e1b4b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Little star sparkle in eyes */}
                  <circle
                    cx="86"
                    cy="69"
                    r="2.5"
                    fill="#FBBF24"
                    opacity="0.9"
                  />
                  <circle
                    cx="114"
                    cy="69"
                    r="2.5"
                    fill="#FBBF24"
                    opacity="0.9"
                  />
                  {/* Eyelashes happy */}
                  <path
                    d="M80,72 Q88,66 96,72"
                    stroke="#1e1b4b"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M104,72 Q112,66 120,72"
                    stroke="#1e1b4b"
                    strokeWidth="2"
                    fill="none"
                  />
                </>
              ) : (
                <g className="eye-blink">
                  {/* Eye whites */}
                  <circle cx="88" cy="73" r="10" fill="white" />
                  <circle cx="112" cy="73" r="10" fill="white" />
                  {/* Iris */}
                  <circle cx="89" cy="74" r="6.5" fill="#3B82F6" />
                  <circle cx="113" cy="74" r="6.5" fill="#3B82F6" />
                  {/* Pupil */}
                  <circle cx="89" cy="74" r="3.8" fill="#1e1b4b" />
                  <circle cx="113" cy="74" r="3.8" fill="#1e1b4b" />
                  {/* Eye shine large */}
                  <circle cx="91.5" cy="71.5" r="2.2" fill="white" />
                  <circle cx="115.5" cy="71.5" r="2.2" fill="white" />
                  {/* Eye shine small */}
                  <circle cx="87" cy="76" r="1.1" fill="white" />
                  <circle cx="111" cy="76" r="1.1" fill="white" />
                  {/* Top eyelashes arc */}
                  <path
                    d="M78,67 Q88,62 98,67"
                    stroke="#1e1b4b"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M102,67 Q112,62 122,67"
                    stroke="#1e1b4b"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Bottom lash hint */}
                  <path
                    d="M80,79 Q88,82 96,79"
                    stroke="#1e1b4b"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.4"
                  />
                  <path
                    d="M104,79 Q112,82 120,79"
                    stroke="#1e1b4b"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.4"
                  />
                </g>
              )}

              {/* Cute nose */}
              <circle cx="97" cy="82" r="2.2" fill="rgba(180,90,60,0.32)" />
              <circle cx="103" cy="82" r="2.2" fill="rgba(180,90,60,0.32)" />

              {/* Mouth */}
              {isPaid ? (
                <>
                  <path
                    d="M84,90 Q100,103 116,90"
                    stroke="#1e1b4b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Open smile fill */}
                  <path
                    d="M86,91 Q100,102 114,91 Q100,101 86,91"
                    fill="white"
                  />
                  {/* Tongue */}
                  <path d="M92,96 Q100,100 108,96" fill="#f87171" />
                </>
              ) : (
                <path
                  d="M87,89 Q100,96 113,89"
                  stroke="#1e1b4b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* ── PAID sparkles / PENDING floating heart ── */}
              {isPaid ? (
                <>
                  <text x="12" y="54" fontSize="20" className="spin-in">
                    ⭐
                  </text>
                  <text
                    x="158"
                    y="60"
                    fontSize="15"
                    className="spin-in"
                    style={{ animationDelay: "0.25s" }}
                  >
                    ✨
                  </text>
                  <text
                    x="162"
                    y="102"
                    fontSize="14"
                    className="spin-in"
                    style={{ animationDelay: "0.4s" }}
                  >
                    🎉
                  </text>
                  <text
                    x="6"
                    y="102"
                    fontSize="14"
                    className="spin-in"
                    style={{ animationDelay: "0.35s" }}
                  >
                    💫
                  </text>
                </>
              ) : (
                <text
                  x="112"
                  y="44"
                  fontSize="16"
                  className="heart-pop"
                  style={{ display: "inline-block" }}
                >
                  💜
                </text>
              )}
            </svg>
          </div>

          {/* Status indicator */}
          {!isPaid && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#eff6ff",
                border: "1.5px solid #bfdbfe",
                borderRadius: "999px",
                padding: "0.375rem 1rem",
                fontSize: "0.8125rem",
                color: "#1d4ed8",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#3B82F6",
                  display: "inline-block",
                }}
                className="shimmer"
              />
              Waiting for MoMo confirmation{dots}
            </div>
          )}

          {isPaid && (
            <div
              className="pop-in"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#dcfce7",
                border: "1.5px solid #bbf7d0",
                borderRadius: "999px",
                padding: "0.375rem 1rem",
                fontSize: "0.8125rem",
                color: "#15803d",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              ✅ Payment Confirmed!
            </div>
          )}

          {/* Heading */}
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0F1F3D",
              margin: "0 0 0.5rem",
              lineHeight: 1.25,
            }}
          >
            {isPaid
              ? "🎉 Payment Successful!"
              : "Approve the prompt on your phone"}
          </h1>

          <p
            style={{
              fontSize: "0.9375rem",
              color: "#475569",
              lineHeight: 1.65,
              margin: "0 0 1.5rem",
            }}
          >
            {isPaid
              ? "Your funds are safely held in escrow. The seller will be notified and will begin working on your order. Check your email for your receipt and chat link."
              : `A Mobile Money payment prompt has been sent to your phone. Approve it to confirm your payment. This page will update automatically once confirmed.`}
          </p>

          {/* Email chip */}
          {buyerEmail && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0.5rem 0.875rem",
                fontSize: "0.8125rem",
                color: "#64748b",
                marginBottom: "1.75rem",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {isPaid ? "Receipt sent to" : "Confirmation will be sent to"}
              &nbsp;
              <strong style={{ color: "#0F1F3D" }}>{buyerEmail}</strong>
            </div>
          )}

          {/* Invoice chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "#64748b",
              marginBottom: "1.75rem",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Invoice&nbsp;
            <strong style={{ color: "#0F1F3D", fontFamily: "monospace" }}>
              {invoice_number}
            </strong>
          </div>

          {/* CTA buttons */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {isPaid && (
              <Link
                href={`/invoice/${invoice_number}`}
                style={{
                  display: "block",
                  padding: "0.8125rem",
                  background: "#10B981",
                  color: "#ffffff",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                View Invoice & Download Receipt
              </Link>
            )}
            <Link
              href="/"
              style={{
                display: "block",
                padding: "0.75rem",
                background: "#f1f5f9",
                color: "#475569",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              ← Back to Home
            </Link>
          </div>

          {/* Fonlok branding watermark */}
          <p
            style={{
              marginTop: "1.75rem",
              fontSize: "0.75rem",
              color: "#cbd5e1",
              letterSpacing: "0.03em",
            }}
          >
            Secured by&nbsp;
            <span style={{ fontWeight: 800, color: "#94a3b8" }}>
              Fonlok Escrow
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
