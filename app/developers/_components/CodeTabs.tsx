"use client";
import { useState } from "react";

const CODE_BG = "#1E2029";
const CODE_TEXT = "#ABB2BF";

type Lang = "curl" | "js" | "python";

interface CodeTabsProps {
  curl?: string;
  js?: string;
  python?: string;
}

const LANG_LABELS: Record<Lang, string> = {
  curl: "cURL",
  js: "JavaScript",
  python: "Python",
};

export default function CodeTabs({ curl, js, python }: CodeTabsProps) {
  const available = (["curl", "js", "python"] as Lang[]).filter((l) =>
    l === "curl" ? !!curl : l === "js" ? !!js : !!python,
  );
  const [active, setActive] = useState<Lang>(available[0] ?? "curl");
  const [copied, setCopied] = useState(false);

  if (available.length === 0) return null;

  const code =
    active === "curl"
      ? (curl ?? "")
      : active === "js"
        ? (js ?? "")
        : (python ?? "");

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#16181f",
          borderRadius: "10px 10px 0 0",
          padding: "0 0.5rem 0 0",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex" }}>
          {available.map((lang) => (
            <button
              key={lang}
              onClick={() => setActive(lang)}
              style={{
                padding: "0.55rem 1rem",
                background: "none",
                border: "none",
                borderBottom:
                  active === lang
                    ? "2px solid #F59E0B"
                    : "2px solid transparent",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: active === lang ? 700 : 400,
                color: active === lang ? "#F59E0B" : "rgba(255,255,255,0.38)",
                transition: "color 0.14s",
                marginBottom: "-1px",
                whiteSpace: "nowrap",
              }}
            >
              {LANG_LABELS[lang]}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <button
          onClick={copy}
          aria-label="Copy code"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.35rem 0.7rem",
            borderRadius: "5px",
            color: copied ? "#22C55E" : "rgba(255,255,255,0.28)",
            fontSize: "0.7rem",
            fontWeight: 600,
            transition: "color 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            whiteSpace: "nowrap",
          }}
        >
          {copied ? (
            <>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div
        style={{
          background: CODE_BG,
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: "1rem 1.25rem",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "0.8125rem",
            color: CODE_TEXT,
            lineHeight: 1.75,
            overflowX: "auto",
            whiteSpace: "pre",
          }}
        >
          {code}
        </pre>
      </div>
    </div>
  );
}
