"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simple mailto fallback — posts to backend contact endpoint if available
    const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Could not send message.");
      setSent(true);
    } catch {
      // Fallback: open mail client
      const subject = encodeURIComponent(`Fonlok contact from ${form.name}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
      );
      window.location.href = `mailto:support@fonlok.com?subject=${subject}&body=${body}`;
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="alert alert-success">
        Your message has been sent. We will get back to you as soon as possible.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <div>
        <label className="label" htmlFor="contact-name">
          Your name
        </label>
        <input
          id="contact-name"
          className="input"
          type="text"
          placeholder="e.g. Jean-Pierre Nkeng"
          value={form.name}
          onChange={update("name")}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-email">
          Email address
        </label>
        <input
          id="contact-email"
          className="input"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update("email")}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className="input"
          rows={5}
          placeholder="Write your message here…"
          value={form.message}
          onChange={update("message")}
          required
          style={{ resize: "vertical" }}
        />
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
        style={{ alignSelf: "flex-start" }}
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
