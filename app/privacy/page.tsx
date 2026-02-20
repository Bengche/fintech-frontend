import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy | Fonlok",
  description:
    "Fonlok's privacy policy explains what data we collect, how we use it, and your rights as a user of our escrow payment platform in Cameroon.",
  alternates: { canonical: "https://fonlok.com/privacy" },
};

export default function PrivacyPage() {
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
              Privacy Policy
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
              {PRIVACY_SECTIONS.map((section) => (
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

const PRIVACY_SECTIONS = [
  {
    heading: "1. Who we are",
    content: (
      <p>
        <a href="https://fonlok.com" target="_blank" rel="noopener noreferrer">
          Fonlok
        </a>{" "}
        (fonlok.com) is operated by{" "}
        <a
          href="https://brancodeX.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          BranCodeX
        </a>
        , based in Cameroon. This Privacy Policy explains how we handle
        information collected when you use our escrow payment platform.
      </p>
    ),
  },
  {
    heading: "2. Information we collect",
    content: (
      <>
        <p>We collect information you provide directly:</p>
        <ul
          style={{
            marginTop: "0.75rem",
            paddingLeft: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          <li>Name and email address (when you register)</li>
          <li>Phone number (for mobile money payouts)</li>
          <li>Invoice details (amounts, descriptions, counterparty emails)</li>
          <li>Messages sent through dispute or contact forms</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          We also collect information automatically:
        </p>
        <ul
          style={{
            marginTop: "0.75rem",
            paddingLeft: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          <li>IP address and device type</li>
          <li>Cookies used for authentication (session tokens)</li>
          <li>Pages visited and actions taken on the platform</li>
        </ul>
      </>
    ),
  },
  {
    heading: "3. How we use your information",
    content: (
      <ul
        style={{
          paddingLeft: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
        }}
      >
        <li>To process and manage escrow transactions</li>
        <li>To verify your identity and prevent fraud</li>
        <li>To send transaction notifications and receipts by email</li>
        <li>To resolve disputes between buyers and sellers</li>
        <li>To improve the platform based on how it is used</li>
        <li>To comply with our legal obligations under Cameroonian law</li>
      </ul>
    ),
  },
  {
    heading: "4. Sharing your information",
    content: (
      <>
        <p>
          We do not sell your personal information. We may share information
          with:
        </p>
        <ul
          style={{
            marginTop: "0.75rem",
            paddingLeft: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          <li>
            <strong>Payment processors</strong> (CamPay) to facilitate Mobile
            Money transactions
          </li>
          <li>
            <strong>Email services</strong> (SendGrid) to send notifications and
            receipts
          </li>
          <li>
            <strong>Law enforcement</strong> where required by law or to
            investigate fraud
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "5. Cookies",
    content: (
      <p>
        Fonlok uses a single authentication cookie to keep you logged in. This
        cookie is essential for the platform to function. It is removed when you
        log out or after a period of inactivity. We do not use advertising or
        tracking cookies.
      </p>
    ),
  },
  {
    heading: "6. Data security",
    content: (
      <p>
        All data is transmitted over HTTPS. Passwords are hashed using
        industry-standard algorithms and are never stored in plain text. We take
        reasonable technical and organisational measures to protect your data
        from unauthorised access.
      </p>
    ),
  },
  {
    heading: "7. Data retention",
    content: (
      <p>
        We retain your account data for as long as your account is active.
        Transaction records are retained for a minimum of 5 years to comply with
        Cameroonian financial record-keeping requirements. You may request
        deletion of your account and personal data by contacting us.
      </p>
    ),
  },
  {
    heading: "8. Your rights",
    content: (
      <>
        <p>You have the right to:</p>
        <ul
          style={{
            marginTop: "0.75rem",
            paddingLeft: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Object to certain uses of your data</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          To exercise any of these rights, contact us at{" "}
          <a
            href="mailto:support@fonlok.com"
            style={{ color: "var(--color-primary)", fontWeight: 600 }}
          >
            support@fonlok.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    heading: "9. Children",
    content: (
      <p>
        Fonlok is not intended for users under the age of 18. We do not
        knowingly collect data from minors. If you believe a minor has
        registered, please contact us immediately.
      </p>
    ),
  },
  {
    heading: "10. Changes to this policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. We will notify
        registered users of significant changes by email. Continued use of
        Fonlok after changes constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    heading: "11. Contact",
    content: (
      <p>
        For privacy-related questions, contact us at{" "}
        <a
          href="mailto:support@fonlok.com"
          style={{ color: "var(--color-primary)", fontWeight: 600 }}
        >
          support@fonlok.com
        </a>{" "}
        or via WhatsApp at{" "}
        <a
          href="https://wa.me/237654155218"
          style={{ color: "var(--color-primary)", fontWeight: 600 }}
          target="_blank"
          rel="noopener noreferrer"
        >
          +237 654 155 218
        </a>
        .
      </p>
    ),
  },
];
