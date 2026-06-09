"use client";
import { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { useSearchParams, useParams } from "next/navigation";
import DisputeButton from "../../components/DisputeButton";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Message = {
  id: number;
  sender_type: string;
  sender_email: string;
  message: string | null;
  file_url: string | null;
  created_at: string;
};

type Milestone = {
  id: number;
  milestone_number: number;
  label: string;
  amount: number;
  deadline?: string;
  status: "pending" | "completed" | "released" | "disputed";
};

export default function BuyerChatPage() {
  const { invoice_number } = useParams<{ invoice_number: string }>();
  const t = useTranslations("BuyerChat");

  // Read the token from the URL e.g. /chat/INV-123?token=abc123
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // dispute=true is added to the URL when the buyer clicks "Open a Dispute" from their email
  const openDisputeDirectly = searchParams.get("dispute") === "true";

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Milestone release state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [releaseConfirmId, setReleaseConfirmId] = useState<number | null>(null);
  const [releaseLoading, setReleaseLoading] = useState<number | null>(null);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccessId, setReleaseSuccessId] = useState<number | null>(null);
  const [releaseReviewInfo, setReleaseReviewInfo] = useState<{
    sellerUsername: string;
    invoiceNumber: string;
  } | null>(null);
  const bottomOfChat = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  // Fetch all messages for this invoice
  const fetchMessages = async () => {
    try {
      const response = await Axios.get(
        `${API}/chat/messages/${invoice_number}?token=${token}`,
      );
      setMessages(response.data.messages);
    } catch (error: unknown) {
      const e = error as { response?: { status?: number }; message?: string };
      if (e.response?.status === 401) {
        setIsAccessDenied(true);
      } else {
        console.log("Could not load messages:", e.message);
      }
    }
  };

  // Only scroll to bottom when the message count actually increases
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      bottomOfChat.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!token) {
      setIsAccessDenied(true);
      return;
    }

    fetchMessages(); // fetch immediately on page load

    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch milestone data for this invoice (visible to buyer)
  useEffect(() => {
    if (!token || !invoice_number) return;
    Axios.get(`${API}/invoice/milestones/${invoice_number}`)
      .then((res) => setMilestones(res.data.milestones || []))
      .catch(() => {}); // non-fatal — not all invoices have milestones
  }, [invoice_number, token]);

  // Release a specific milestone via the buyer's chat token
  const releaseMilestone = async (milestoneId: number) => {
    setReleaseLoading(milestoneId);
    setReleaseError("");
    try {
      const { data } = await Axios.post(
        `${API}/api/release-milestone/confirm`,
        {
          invoice_number,
          buyer_token: token,
          milestone_id: milestoneId,
        },
      );
      setReleaseConfirmId(null);
      setReleaseSuccessId(milestoneId);
      if (data.sellerUsername) {
        setReleaseReviewInfo({
          sellerUsername: data.sellerUsername,
          invoiceNumber: invoice_number,
        });
      }
      // Refresh the milestone list to show updated statuses
      const msRes = await Axios.get(
        `${API}/invoice/milestones/${invoice_number}`,
      );
      setMilestones(msRes.data.milestones || []);
      setTimeout(() => setReleaseSuccessId(null), 15000);
    } catch (err: unknown) {
      setReleaseError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("releaseErrorDefault"),
      );
    } finally {
      setReleaseLoading(null);
    }
  };

  // Send a text message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await Axios.post(`${API}/chat/send/${invoice_number}`, {
        message: newMessage,
        sender_type: "buyer",
        token: token,
      });
      setNewMessage("");
      fetchMessages();
    } catch {
      setErrorMessage(t("errorSend"));
    }
  };

  // Upload a file
  const uploadFile = async () => {
    if (!selectedFile || uploadProgress < 100) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sender_type", "buyer");
    formData.append("token", token || "");

    setIsUploading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API}/chat/upload/${invoice_number}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(xhr.statusText));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchMessages();
    } catch {
      setErrorMessage(t("errorUpload"));
    } finally {
      setIsUploading(false);
    }
  };

  // Simulate "readiness" progress when a file is selected (reads the file locally)
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setUploadProgress(0);
    if (!file) return;
    // Read file to simulate checking readiness — increments to 100 quickly
    const reader = new FileReader();
    let fakeProgress = 0;
    const tick = setInterval(() => {
      fakeProgress = Math.min(
        fakeProgress + Math.floor(Math.random() * 18) + 8,
        99,
      );
      setUploadProgress(fakeProgress);
    }, 80);
    reader.onload = () => {
      clearInterval(tick);
      setUploadProgress(100);
    };
    reader.onerror = () => clearInterval(tick);
    reader.readAsArrayBuffer(file);
  };

  // Show an error page if the token is missing or invalid
  if (isAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl shadow-lg p-8">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t("accessDeniedTitle")}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{t("accessDeniedBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top header bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-slate-800 text-base leading-tight truncate">{t("title")}</h1>
            <p className="text-xs text-slate-400 truncate">{t("invoiceLabel")} {invoice_number}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">

        {/* ── Milestone panel ─────────────────────────────────────────── */}
        {milestones.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">{t("milestoneSection")}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {t("milestonesProgress", {
                    done: milestones.filter((m) => m.status === "released").length,
                    total: milestones.length,
                  })}
                </p>
              </div>
              <span className="text-xs text-slate-400 hidden sm:block">{t("milestoneHint")}</span>
            </div>

            {/* Progress strip */}
            <div className="h-1 bg-slate-100">
              <div
                className="h-1 bg-green-500 transition-all duration-500"
                style={{ width: `${(milestones.filter((m) => m.status === "released").length / milestones.length) * 100}%` }}
              />
            </div>

            <div className="divide-y divide-slate-100">
              {milestones.map((m, i) => (
                <div key={m.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        m.status === "released" ? "bg-green-100 text-green-700" :
                        m.status === "completed" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                      }`}>{i + 1}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm leading-snug">{m.label}</p>
                        <p className="text-sm text-slate-500 mt-0.5 font-medium">{Number(m.amount).toLocaleString()} XAF</p>
                        {m.deadline && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {t("milestoneDue")} {new Date(m.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        m.status === "released" ? "bg-green-100 text-green-700" :
                        m.status === "completed" ? "bg-amber-100 text-amber-700" :
                        m.status === "disputed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {m.status === "released" ? `✓ ${t("milestoneStatusReleased")}` :
                         m.status === "completed" ? t("milestoneStatusCompleted") :
                         m.status === "disputed" ? t("milestoneStatusDisputed") : t("milestoneStatusPending")}
                      </span>
                      {m.status === "completed" && (
                        <button
                          onClick={() => { setReleaseConfirmId(m.id); setReleaseError(""); }}
                          disabled={releaseLoading === m.id}
                          className="text-xs bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60 transition-colors shadow-sm"
                        >
                          {releaseLoading === m.id ? t("releasing") : t("releasePayment")}
                        </button>
                      )}
                    </div>
                  </div>

                  {releaseConfirmId === m.id && (
                    <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm font-bold text-amber-800 mb-1">{t("releaseConfirmTitle")}</p>
                      <p className="text-xs text-amber-700 leading-relaxed mb-3">
                        {t("releaseConfirmBody", { amount: Number(m.amount).toLocaleString(), label: m.label })}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => releaseMilestone(m.id)} disabled={releaseLoading === m.id}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-60 transition-colors">
                          {releaseLoading === m.id ? t("releasing") : t("releaseConfirm")}
                        </button>
                        <button onClick={() => { setReleaseConfirmId(null); setReleaseError(""); }}
                          className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                          {t("releaseCancel")}
                        </button>
                      </div>
                      {releaseError && <p className="text-xs text-red-600 mt-2 font-medium">{releaseError}</p>}
                    </div>
                  )}

                  {releaseSuccessId === m.id && (
                    <div className="mt-2 p-3.5 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs text-green-700 font-semibold mb-2">✓ {t("releaseSuccess")}</p>
                      {releaseReviewInfo && (
                        <div className="mt-1 pt-2 border-t border-green-200">
                          <p className="text-xs text-slate-600 font-medium mb-1.5">{t("reviewPromptTitle")}</p>
                          <p className="text-xs text-slate-500 mb-2">{t("reviewPromptBody")}</p>
                          <a href={`/review/${releaseReviewInfo.sellerUsername}/${releaseReviewInfo.invoiceNumber}`}
                            className="inline-block text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                            {t("reviewPromptCta")}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Chat card ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

          {/* Messages area */}
          <div
            className="overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-3"
            style={{ minHeight: "320px", maxHeight: "60vh" }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">{t("empty")}</p>
              </div>
            )}

            {messages.map((msg) => {
              const isBuyer = msg.sender_type === "buyer";
              const isSystem = msg.sender_type === "system";
              const isModerator = msg.sender_type === "moderator";
              return (
                <div key={msg.id} className={`flex flex-col ${isBuyer ? "items-end" : isSystem || isModerator ? "items-center" : "items-start"}`}>
                  {/* Sender label */}
                  <span className="text-xs text-slate-400 font-medium px-1 mb-1">
                    {isBuyer ? t("youBuyer") : isSystem ? "⚠️ System" : isModerator ? "🛡️ Moderator" : t("seller")}
                  </span>

                  {/* Bubble */}
                  <div
                    className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={{
                      backgroundColor: isBuyer ? "#2563eb" : isSystem ? "#fef3c7" : isModerator ? "#eff6ff" : "#f1f5f9",
                      color: isBuyer ? "#fff" : "#1e293b",
                      border: isSystem ? "1px solid #f59e0b" : isModerator ? "1px solid #93c5fd" : "none",
                      borderRadius: isBuyer ? "18px 18px 4px 18px" : isSystem || isModerator ? "14px" : "18px 18px 18px 4px",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
                    {msg.file_url && (
                      <a
                        href={`${msg.file_url}?token=${encodeURIComponent(token || "")}&invoice=${encodeURIComponent(invoice_number)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 mt-1 underline underline-offset-2"
                        style={{ color: isBuyer ? "#bfdbfe" : "#2563eb", fontSize: "0.8125rem" }}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {t("viewFile")}
                      </a>
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-xs text-slate-400 px-1 mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomOfChat} />
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="mx-3 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* ── File upload ─────────────────────────────────────────── */}
          <div className="border-t border-slate-100 px-3 py-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />
            {!selectedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>{t("attachFile")}</span>
              </button>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs text-slate-700 font-medium truncate flex-1 min-w-0">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                  <button
                    onClick={() => { setSelectedFile(null); setUploadProgress(0); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%`, backgroundColor: uploadProgress < 100 ? "#f59e0b" : "#22c55e" }} />
                </div>
                <p className="text-xs font-medium" style={{ color: uploadProgress < 100 ? "#b45309" : "#15803d" }}>
                  {isUploading ? `${t("uploading")}… ${uploadProgress}%` : uploadProgress < 100 ? `${t("preparingFile")} ${uploadProgress}%` : `✓ ${t("readyToUpload")}`}
                </p>
                <button
                  onClick={uploadFile}
                  disabled={uploadProgress < 100 || isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: uploadProgress < 100 || isUploading ? "#e2e8f0" : "#1d4ed8",
                    color: uploadProgress < 100 || isUploading ? "#94a3b8" : "#ffffff",
                    boxShadow: uploadProgress === 100 && !isUploading ? "0 2px 8px rgba(29,78,216,0.3)" : "none",
                  }}
                >
                  {isUploading ? (
                    <><svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>{t("uploading")}…</>
                  ) : (
                    <><svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>{t("uploadBtn")}</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Message compose ─────────────────────────────────────── */}
          <div className="border-t border-slate-100 px-3 pb-3 pt-2">
            <div className="flex gap-2 items-end">
              <textarea
                placeholder={t("messagePlaceholder")}
                value={newMessage}
                maxLength={1500}
                rows={3}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 min-w-0 border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2.5 text-sm resize-none leading-relaxed outline-none transition-all bg-slate-50 focus:bg-white"
                style={{ fontSize: "16px" /* prevents iOS zoom */ }}
              />
              <button
                onClick={sendMessage}
                className="shrink-0 w-11 h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                aria-label={t("send")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              {newMessage.length >= 1500 ? (
                <p className="text-xs font-semibold text-red-600">{t("charLimitReached")}</p>
              ) : (
                <p className={`text-xs ${newMessage.length >= 1200 ? "text-amber-500 font-medium" : "text-slate-400"}`}>
                  {newMessage.length} / 1,500
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Dispute section ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-4">
          <p className="text-sm text-slate-500 mb-3">{t("haveAProblem")}</p>
          <DisputeButton
            invoice_number={invoice_number}
            sender_type="buyer"
            buyer_token={token || ""}
            autoOpen={openDisputeDirectly}
            paymentType={milestones.length > 0 ? "installment" : undefined}
          />
        </div>

        {/* Bottom safe-area spacer for mobile */}
        <div className="h-4" />
      </div>
    </div>
  );
}
