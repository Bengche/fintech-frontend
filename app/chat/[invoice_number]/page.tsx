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
  const [errorMessage, setErrorMessage] = useState("");
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const bottomOfChat = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  // Fetch all messages for this invoice
  const fetchMessages = async () => {
    try {
      const response = await Axios.get(
        `${API}/chat/messages/${invoice_number}?token=${token}`,
      );
      setMessages(response.data.messages);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAccessDenied(true);
      } else {
        console.log("Could not load messages:", error.message);
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
    } catch (error: any) {
      setErrorMessage(t("errorSend"));
    }
  };

  // Upload a file
  const uploadFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sender_type", "buyer");
    formData.append("token", token || "");

    try {
      await Axios.post(`${API}/chat/upload/${invoice_number}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      fetchMessages();
    } catch (error: any) {
      setErrorMessage(t("errorUpload"));
    }
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

      {/* Messages area */}
      <div className="w-full max-w-xl border border-gray-300 rounded-md bg-white">
        <div className="h-96 overflow-y-auto p-3 flex flex-col gap-2">
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
                  msg.sender_type === "buyer" ? "flex-end" : "flex-start",
                backgroundColor:
                  msg.sender_type === "buyer" ? "#dbeafe" : "#f3f4f6",
                textAlign: msg.sender_type === "buyer" ? "right" : "left",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                minWidth: 0,
              }}
            >
              {/* Who sent it */}
              <span className="text-xs text-gray-500 mb-1">
                {msg.sender_type === "buyer" ? t("youBuyer") : t("seller")}
              </span>

              {/* Text message */}
              {msg.message && (
                <p style={{ margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>
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
        <div className="flex items-center gap-2 px-3 pb-2 border-t border-gray-200 pt-2">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          {selectedFile && (
            <button
              onClick={uploadFile}
              className="bg-gray-600 text-white text-sm rounded p-1"
            >
              {t("uploadBtn")}
            </button>
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
        />
      </div>
    </div>
  );
}
