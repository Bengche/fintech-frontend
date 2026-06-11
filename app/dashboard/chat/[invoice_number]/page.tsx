"use client";
import { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DisputeButton from "../../../components/DisputeButton";
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

export default function SellerChatPage() {
  const { invoice_number } = useParams<{ invoice_number: string }>();
  const router = useRouter();
  const t = useTranslations("Chat");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatExists, setChatExists] = useState<boolean | null>(null);
  const [invoicePaymentType, setInvoicePaymentType] = useState<
    string | undefined
  >(undefined);
  const bottomOfChat = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  const fetchMessages = async () => {
    try {
      const res = await Axios.get(`${API}/chat/messages/${invoice_number}`, {
        withCredentials: true,
      });
      const msgs = res.data.messages ?? [];
      setMessages(msgs);
      setChatExists(true);
    } catch (err: unknown) {
      if (
        (err as { response?: { status?: number } })?.response?.status === 404
      ) {
        setChatExists(false);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice_number]);

  // Detect milestone invoices to enable the multi-step dispute flow
  useEffect(() => {
    Axios.get(`${API}/invoice/milestones/${invoice_number}`, {
      withCredentials: true,
    })
      .then((res) => {
        const ms = res.data.milestones || res.data || [];
        if (ms.length > 0) setInvoicePaymentType("installment");
      })
      .catch(() => {}); // non-fatal
  }, [invoice_number]);

  // Only scroll to bottom when the message count actually increases
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      bottomOfChat.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      await Axios.post(
        `${API}/chat/send/${invoice_number}`,
        { message: newMessage, sender_type: "seller" },
        { withCredentials: true },
      );
      setNewMessage("");
      fetchMessages();
    } catch {
      setErrorMessage(t("errorSend"));
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setUploadProgress(0);
    if (!file) return;
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

  const uploadFile = async () => {
    if (!selectedFile || uploadProgress < 100) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sender_type", "seller");
    setIsUploading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API}/chat/upload/${invoice_number}`);
        xhr.withCredentials = true;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
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
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top header bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-slate-800 text-base leading-tight truncate">
              Chat with Buyer
            </h1>
            <p className="text-xs text-slate-400 truncate">
              Invoice #{invoice_number}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Chat card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Messages area */}
          <div
            className="overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-3"
            style={{ minHeight: "320px", maxHeight: "60vh" }}
          >
            {chatExists === false ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"
                    />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">
                  Chat opens once the buyer completes payment.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"
                    />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">{t("empty")}</p>
              </div>
            ) : null}

            {messages.map((msg) => {
              const isSeller = msg.sender_type === "seller";
              const isSystem = msg.sender_type === "system";
              const isModerator = msg.sender_type === "moderator";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isSeller ? "items-end" : isSystem || isModerator ? "items-center" : "items-start"}`}
                >
                  <span className="text-xs text-slate-400 font-medium px-1 mb-1">
                    {isSystem
                      ? "System"
                      : isModerator
                        ? "Moderator"
                        : isSeller
                          ? t("youSeller")
                          : `Buyer (${msg.sender_email})`}
                  </span>
                  <div
                    className="max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed"
                    style={{
                      backgroundColor: isSystem
                        ? "#fef3c7"
                        : isModerator
                          ? "#eff6ff"
                          : isSeller
                            ? "#2563eb"
                            : "#f1f5f9",
                      color: isSeller ? "#fff" : "#1e293b",
                      border: isSystem
                        ? "1px solid #f59e0b"
                        : isModerator
                          ? "1px solid #93c5fd"
                          : "none",
                      borderRadius: isSeller
                        ? "18px 18px 4px 18px"
                        : isSystem || isModerator
                          ? "14px"
                          : "18px 18px 18px 4px",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {msg.message && <p className="m-0">{msg.message}</p>}
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                        style={{ color: isSeller ? "#bfdbfe" : "#2563eb" }}
                      >
                        {t("viewFile")}
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomOfChat} />
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="mx-3 mb-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Input area only when chat exists */}
          {chatExists !== false && (
            <>
              {/* File attachment row */}
              <div className="px-3.5 pt-2.5 pb-2 border-t border-slate-100 bg-slate-50">
                <label
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${selectedFile ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <svg
                    className={`w-4 h-4 shrink-0 ${selectedFile ? "text-blue-500" : "text-slate-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span
                    className={`text-sm flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${selectedFile ? "text-slate-700" : "text-slate-400"}`}
                  >
                    {selectedFile ? selectedFile.name : t("attachFile")}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) =>
                      handleFileSelect(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                  {selectedFile && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        uploadFile();
                      }}
                      disabled={isUploading || uploadProgress < 100}
                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg font-semibold transition-colors shrink-0"
                    >
                      {isUploading
                        ? `${uploadProgress}%`
                        : uploadProgress < 100
                          ? "Checking"
                          : t("upload")}
                    </button>
                  )}
                </label>
                {selectedFile && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-1 bg-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Message input row */}
              <div className="border-t border-slate-100 px-3.5 pt-2.5 pb-3">
                <div className="flex gap-2 items-end">
                  <textarea
                    placeholder={t("messagePlaceholder")}
                    value={newMessage}
                    maxLength={1500}
                    rows={3}
                    onChange={(e) =>
                      setNewMessage(e.target.value.slice(0, 1500))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isSending) sendMessage();
                      }
                    }}
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{
                      fontSize: "16px",
                      minHeight: "72px",
                      lineHeight: "1.5",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors"
                    aria-label={t("send")}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
                <p
                  className={`text-xs mt-1.5 text-right ${newMessage.length >= 1500 ? "text-red-500 font-semibold" : newMessage.length >= 1200 ? "text-amber-500" : "text-slate-400"}`}
                >
                  {newMessage.length >= 1500
                    ? t("charLimitReached")
                    : `${newMessage.length} / 1,500`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Dispute section */}
        {chatExists === true && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <p className="text-sm text-slate-500 leading-relaxed mb-3">
              If there is a problem with this order, you can open a dispute and
              an admin will review the chat.
            </p>
            <DisputeButton
              invoice_number={invoice_number}
              sender_type="seller"
              paymentType={invoicePaymentType}
            />
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
