import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service | Fonlok",
  description:
    "Read Fonlok's terms of service. By using Fonlok you agree to these terms governing the use of our escrow payment platform in Cameroon.",
  alternates: { canonical: "https://fonlok.com/terms" },
};

export default function TermsPage() {
  const lastUpdated = "1 January 2025";

  return (
    <>
      <SiteHeader />

      <main>
        <section
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "3.5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "720px" }}>
            <h1
              style={{
                fontSize: "clamp(1.625rem, 4vw, 2.25rem)",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "0.5rem",
              }}
            >
              Terms of Service
            </h1>
            <p
              style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)" }}
            >
              Last updated: {lastUpdated}
            </p>
          </div>
        </section>

        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "4rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "720px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2.5rem",
              }}
            >
              {TERMS_SECTIONS.map((section) => (
                <div key={section.heading}>
                  <h2
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      marginBottom: "0.875rem",
                      color: "var(--color-primary)",
                    }}
                  >
                    {section.heading}
                  </h2>
                  <div
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--color-text-body)",
                      lineHeight: 1.85,
                    }}
                  >
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

const TERMS_SECTIONS = [
  {
    heading: "1. Agreement to terms",
    content: (
      <p>
        By accessing or using Fonlok (fonlok.com), you agree to be bound by
        these Terms of Service. If you do not agree to these terms, do not use
        the platform. Fonlok is operated by{" "}
        <a
          href="https://brancodeX.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          BranCodeX
        </a>
        , registered in Cameroon.
      </p>
    ),
  },
  {
    heading: "2. Description of service",
    content: (
      <p>
        Fonlok is an escrow payment platform that holds funds on behalf of
        buyers and sellers during commercial transactions. Fonlok acts as a
        neutral third party and releases funds only when both parties fulfil
        their obligations. Fonlok is not a bank, financial institution, or
        payment processor.
      </p>
    ),
  },
  {
    heading: "3. Eligibility",
    content: (
      <p>
        You must be at least 18 years old and legally capable of entering into
        contracts under Cameroonian law to use Fonlok. By registering, you
        confirm that all information you provide is accurate and complete.
      </p>
    ),
  },
  {
    heading: "4. Accounts",
    content: (
      <>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials. You are solely responsible for all activity that
          occurs under your account.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          You agree to notify Fonlok immediately at support@fonlok.com if you
          suspect any unauthorised access to your account.
        </p>
      </>
    ),
  },
  {
    heading: "5. Fees",
    content: (
      <p>
        Sellers are charged a service fee of 3% of the invoice value, deducted
        at the time funds are released. Fonlok reserves the right to update its
        fees with reasonable notice. Buyers pay no Fonlok fees unless otherwise
        stated.
      </p>
    ),
  },
  {
    heading: "6. Escrow process",
    content: (
      <p>
        When a buyer pays an invoice, funds are held by Fonlok in escrow until
        the buyer confirms delivery or until a dispute is resolved. Fonlok does
        not release funds to the seller until one of these conditions is met.
        Fonlok reserves the right to hold funds for a reasonable period during
        dispute investigation.
      </p>
    ),
  },
  {
    heading: "7. Disputes",
    content: (
      <p>
        Either party may raise a dispute through the Fonlok dashboard. Fonlok
        will review all evidence submitted and make a final determination.
        Fonlok&apos;s decision in a dispute is final. Fonlok will not be held
        liable for losses resulting from fraudulent activity by either party.
      </p>
    ),
  },
  {
    heading: "8. Prohibited uses",
    content: (
      <>
        <p>You may not use Fonlok for:</p>
        <ul
          style={{
            marginTop: "0.75rem",
            paddingLeft: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          <li>Illegal goods or services</li>
          <li>Fraud, money laundering, or identity theft</li>
          <li>Any activity that violates Cameroonian law</li>
          <li>Transactions involving prohibited items under applicable law</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          Fonlok reserves the right to freeze or terminate accounts engaged in
          prohibited activity without notice.
        </p>
      </>
    ),
  },
  {
    heading: "9. Limitation of liability",
    content: (
      <p>
        Fonlok&apos;s liability to any user shall not exceed the total fees paid
        by that user in the 30 days preceding the claim. Fonlok is not liable
        for indirect, incidental, or consequential damages arising from the use
        or inability to use the platform.
      </p>
    ),
  },
  {
    heading: "10. Governing law",
    content: (
      <p>
        These Terms are governed by the laws of the Republic of Cameroon. Any
        dispute arising from these Terms shall be subject to the exclusive
        jurisdiction of the courts of Cameroon.
      </p>
    ),
  },
  {
    heading: "11. Changes to these terms",
    content: (
      <p>
        Fonlok may update these Terms at any time. Continued use of the platform
        after changes constitutes acceptance of the updated terms. We will
        notify users of significant changes by email.
      </p>
    ),
  },
  {
    heading: "12. Contact",
    content: (
      <p>
        For questions about these Terms, contact us at{" "}
        <a
          href="mailto:support@fonlok.com"
          style={{ color: "var(--color-primary)", fontWeight: 600 }}
        >
          support@fonlok.com
        </a>
        .
      </p>
    ),
  },
];
