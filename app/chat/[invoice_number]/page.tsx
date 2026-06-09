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
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.statusText)));
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
      fakeProgress = Math.min(fakeProgress + Math.floor(Math.random() * 18) + 8, 99);
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
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-700">
          {t("accessDeniedTitle")}
        </h2>
        <p className="text-gray-600 mt-2">{t("accessDeniedBody")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-bold mb-1">{t("title")}</h2>
      <p className="text-gray-500 text-sm mb-4">
        {t("invoiceLabel")} {invoice_number}
      </p>

      {/* ── Milestone payment release panel (installment invoices only) ─── */}
      {milestones.length > 0 && (
        <div className="w-full max-w-xl mb-5 border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {t("milestoneSection")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("milestonesProgress", {
                    done: milestones.filter((m) => m.status === "released")
                      .length,
                    total: milestones.length,
                  })}
                </p>
              </div>
              <span className="text-xs text-slate-400 hidden sm:block">
                {t("milestoneHint")}
              </span>
            </div>
          </div>

          {/* Milestone rows */}
          <div className="divide-y divide-gray-100">
            {milestones.map((m, i) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: number + info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        m.status === "released"
                          ? "bg-green-100 text-green-700"
                          : m.status === "completed"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">
                        {m.label}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {Number(m.amount).toLocaleString()} XAF
                      </p>
                      {m.deadline && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t("milestoneDue")}{" "}
                          {new Date(m.deadline).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: status badge + action */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        m.status === "released"
                          ? "bg-green-100 text-green-700"
                          : m.status === "completed"
                            ? "bg-amber-100 text-amber-700"
                            : m.status === "disputed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {m.status === "released"
                        ? `✓ ${t("milestoneStatusReleased")}`
                        : m.status === "completed"
                          ? t("milestoneStatusCompleted")
                          : m.status === "disputed"
                            ? t("milestoneStatusDisputed")
                            : t("milestoneStatusPending")}
                    </span>

                    {m.status === "completed" && (
                      <button
                        onClick={() => {
                          setReleaseConfirmId(m.id);
                          setReleaseError("");
                        }}
                        disabled={releaseLoading === m.id}
                        className="text-xs bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 py-1.5 rounded-md font-semibold disabled:opacity-60 transition-colors"
                      >
                        {releaseLoading === m.id
                          ? t("releasing")
                          : t("releasePayment")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline confirmation dialog */}
                {releaseConfirmId === m.id && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm font-bold text-amber-800 mb-1">
                      {t("releaseConfirmTitle")}
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed mb-3">
                      {t("releaseConfirmBody", {
                        amount: Number(m.amount).toLocaleString(),
                        label: m.label,
                      })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => releaseMilestone(m.id)}
                        disabled={releaseLoading === m.id}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md font-bold disabled:opacity-60 transition-colors"
                      >
                        {releaseLoading === m.id
                          ? t("releasing")
                          : t("releaseConfirm")}
                      </button>
                      <button
                        onClick={() => {
                          setReleaseConfirmId(null);
                          setReleaseError("");
                        }}
                        className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        {t("releaseCancel")}
                      </button>
                    </div>
                    {releaseError && (
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        {releaseError}
                      </p>
                    )}
                  </div>
                )}

                {/* Success confirmation */}
                {releaseSuccessId === m.id && (
                  <div className="mt-2 px-3 py-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs text-green-700 font-semibold mb-2">
                      ✓ {t("releaseSuccess")}
                    </p>
                    {releaseReviewInfo && (
                      <div className="mt-1 pt-2 border-t border-green-200">
                        <p className="text-xs text-slate-600 font-medium mb-1.5">
                          {t("reviewPromptTitle")}
                        </p>
                        <p className="text-xs text-slate-500 mb-2">
                          {t("reviewPromptBody")}
                        </p>
                        <a
                          href={`/review/${releaseReviewInfo.sellerUsername}/${releaseReviewInfo.invoiceNumber}`}
                          className="inline-block text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md font-semibold transition-colors"
                        >
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

      {/* Messages area */}
      <div className="w-full max-w-xl border border-gray-300 rounded-md bg-white">
        <div className="h-96 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-4">
              {t("empty")}
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-xs rounded-md p-2 text-sm`}
              style={{
                alignSelf:
                  msg.sender_type === "buyer"
                    ? "flex-end"
                    : msg.sender_type === "system" ||
                        msg.sender_type === "moderator"
                      ? "center"
                      : "flex-start",
                backgroundColor:
                  msg.sender_type === "buyer"
                    ? "#dbeafe"
                    : msg.sender_type === "system"
                      ? "#fef3c7"
                      : msg.sender_type === "moderator"
                        ? "#eff6ff"
                        : "#f3f4f6",
                border:
                  msg.sender_type === "system"
                    ? "1px solid #f59e0b"
                    : msg.sender_type === "moderator"
                      ? "1px solid #93c5fd"
                      : undefined,
                textAlign: msg.sender_type === "buyer" ? "right" : "left",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                minWidth: 0,
              }}
            >
              {/* Who sent it */}
              <span className="text-xs text-gray-500 mb-1">
                {msg.sender_type === "buyer"
                  ? t("youBuyer")
                  : msg.sender_type === "system"
                    ? "⚠️ System"
                    : msg.sender_type === "moderator"
                      ? "🛡️ Moderator"
                      : t("seller")}
              </span>

              {/* Text message */}
              {msg.message && (
                <p
                  style={{
                    margin: 0,
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {msg.message}
                </p>
              )}

              {/* File — buyer token is appended so the backend can auth the request */}
              {msg.file_url && (
                <a
                  href={`${msg.file_url}?token=${encodeURIComponent(token || "")}&invoice=${encodeURIComponent(invoice_number)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {t("viewFile")}
                </a>
              )}

              {/* Timestamp */}
              <span className="text-xs text-gray-400 mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}

          <div ref={bottomOfChat} />
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-red-600 text-sm px-3">{errorMessage}</p>
        )}

        {/* File upload */}
        <div className="px-3 pb-3 border-t border-gray-200 pt-3">
          {/* Hidden real file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />

          {!selectedFile ? (
            /* Pick-file button */
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{t("attachFile")}</span>
            </button>
          ) : (
            /* File selected — show name, progress, upload button */
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
              {/* File info row */}
              <div className="flex items-center gap-2 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-gray-700 font-medium truncate flex-1 min-w-0">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
                {/* Cancel */}
                <button
                  onClick={() => { setSelectedFile(null); setUploadProgress(0); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="shrink-0 text-gray-400 hover:text-red-500 transition-colors ml-1"
                  aria-label="Remove file"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-150"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: uploadProgress < 100 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>
              <p className="text-xs font-medium" style={{ color: uploadProgress < 100 ? "#b45309" : "#15803d" }}>
                {isUploading
                  ? `${t("uploading")}… ${uploadProgress}%`
                  : uploadProgress < 100
                  ? `${t("preparingFile")} ${uploadProgress}%`
                  : `✓ ${t("readyToUpload")}`}
              </p>

              {/* Upload button — disabled until 100% ready */}
              <button
                onClick={uploadFile}
                disabled={uploadProgress < 100 || isUploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: uploadProgress < 100 || isUploading ? "#e5e7eb" : "#1d4ed8",
                  color: uploadProgress < 100 || isUploading ? "#9ca3af" : "#ffffff",
                  boxShadow: uploadProgress === 100 && !isUploading ? "0 1px 3px rgba(29,78,216,0.4)" : "none",
                }}
              >
                {isUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {t("uploading")}…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploadProgress < 100 ? t("uploadBtn") : t("uploadBtn")}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Text message input */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex gap-2 items-end">
            <textarea
              placeholder={t("messagePlaceholder")}
              value={newMessage}
              maxLength={1500}
              rows={2}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 border border-gray-300 rounded p-2 text-sm resize-none leading-snug"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white rounded p-2 text-sm font-bold shrink-0"
            >
              {t("send")}
            </button>
          </div>
          {/* Character counter */}
          {newMessage.length >= 1500 ? (
            <p className="text-xs mt-1 font-semibold text-red-600">
              {t("charLimitReached")}
            </p>
          ) : (
            <p
              className={`text-xs mt-1 text-right ${
                newMessage.length >= 1200 ? "text-amber-600" : "text-gray-400"
              }`}
            >
              {newMessage.length} / 1,500
            </p>
          )}
        </div>
      </div>

      {/* Dispute button - buyer can open a dispute from their chat page */}
      <div className="w-full max-w-xl mt-4">
        <p className="text-sm text-gray-500 mb-1">{t("haveAProblem")}</p>
        <DisputeButton
          invoice_number={invoice_number}
          sender_type="buyer"
          buyer_token={token || ""}
          autoOpen={openDisputeDirectly}
          paymentType={milestones.length > 0 ? "installment" : undefined}
        />
      </div>
    </div>
  );
}
