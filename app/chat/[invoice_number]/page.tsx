"use client";
import { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { useSearchParams } from "next/navigation";
import DisputeButton from "../../components/DisputeButton";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Message = {
  id: number;
  sender_type: string;
  sender_email: string;
  message: string | null;
  file_url: string | null;
  created_at: string;
};

type PageProps = {
  params: {
    invoice_number: string;
  };
};

export default function BuyerChatPage({ params }: PageProps) {
  const { invoice_number } = params;

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

  // Scroll to the latest message whenever messages update
  useEffect(() => {
    if (bottomOfChat.current) {
      bottomOfChat.current.scrollIntoView({ behavior: "smooth" });
    }
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
      setErrorMessage("Failed to send message. Please try again.");
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
      setErrorMessage("Failed to upload file. Please try again.");
    }
  };

  // Show an error page if the token is missing or invalid
  if (isAccessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-700">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          This chat link is invalid or has expired. Please check your email for
          the correct link.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-bold mb-1">Chat with the Seller</h2>
      <p className="text-gray-500 text-sm mb-4">Invoice: {invoice_number}</p>

      {/* Messages area */}
      <div className="w-full max-w-xl border border-gray-300 rounded-md bg-white">
        <div className="h-96 overflow-y-auto p-3 flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-4">
              No messages yet. Feel free to ask the seller a question!
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-xs rounded-md p-2 text-sm ${
                msg.sender_type === "buyer"
                  ? "bg-blue-100 self-end text-right"
                  : "bg-gray-100 self-start text-left"
              }`}
            >
              {/* Who sent it */}
              <span className="text-xs text-gray-500 mb-1">
                {msg.sender_type === "buyer" ? "You (Buyer)" : "Seller"}
              </span>

              {/* Text message */}
              {msg.message && <p>{msg.message}</p>}

              {/* File */}
              {msg.file_url && (
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Uploaded File
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
              Upload
            </button>
          )}
        </div>

        {/* Text message input */}
        <div className="flex gap-2 p-3 border-t border-gray-200">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border border-gray-300 rounded p-2 text-sm"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white rounded p-2 text-sm font-bold"
          >
            Send
          </button>
        </div>
      </div>

      {/* Dispute button - buyer can open a dispute from their chat page */}
      <div className="w-full max-w-xl mt-4">
        <p className="text-sm text-gray-500 mb-1">
          Have a problem with your order?
        </p>
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
