import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Fonlok",
  description:
    "Get in touch with the Fonlok team. We're available via WhatsApp and email to help with any questions about our escrow payment platform in Cameroon.",
  alternates: { canonical: "https://fonlok.com/contact" },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── PAGE HEADER ─────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "4rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "560px" }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "1rem",
              }}
            >
              Get in touch
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
              }}
            >
              We&apos;re here to help. Reach us via WhatsApp, email, or the form
              below.
            </p>
          </div>
        </section>

        {/* ── CONTACT OPTIONS + FORM ───────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div
            className="page-wrapper"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "3rem",
              alignItems: "flex-start",
            }}
          >
            {/* Contact channels */}
            <div style={{ flex: "1 1 280px", maxWidth: "360px" }}>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  marginBottom: "2rem",
                }}
              >
                Contact channels
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* WhatsApp */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-text-muted)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    WhatsApp (fastest)
                  </p>
                  <a
                    href="https://wa.me/237654155218"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      textDecoration: "none",
                      marginBottom: "0.5rem",
                    }}
                  >
                    +237 654 155 218
                  </a>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    Message us on WhatsApp for the quickest response. We
                    typically reply within a few hours.
                  </p>
                </div>

                {/* Email */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-text-muted)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Email
                  </p>
                  <a
                    href="mailto:support@fonlok.com"
                    style={{
                      display: "inline-block",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      textDecoration: "none",
                      marginBottom: "0.5rem",
                    }}
                  >
                    support@fonlok.com
                  </a>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    For detailed questions or if you prefer email. We respond
                    within 24 hours on business days.
                  </p>
                </div>

                {/* Hours note */}
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-mist)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    <strong style={{ color: "var(--color-text-heading)" }}>
                      Support hours:
                    </strong>{" "}
                    Monday – Saturday, 8 AM – 8 PM (WAT)
                  </p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div style={{ flex: "1 1 320px" }}>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  marginBottom: "2rem",
                }}
              >
                Send a message
              </h2>
              <div className="card" style={{ padding: "2rem" }}>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
