"use client";
/**
 * SandboxExplorer — interactive API reference and live request tester.
 *
 * Design principles:
 *  - The API key is held in component state only — never written to
 *    localStorage or cookies to avoid accidental persistence.
 *  - All HTTP calls go directly from the browser to the backend
 *    /sandbox/* routes, authenticated with the key entered by the user.
 *  - Code examples (cURL / JavaScript / Python) are generated live from
 *    the current form values and reflect exactly what the user would run.
 *  - JSON responses are syntax-highlighted client-side using a simple
 *    regex tokenizer — no third-party library required.
 */

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ── Types ─────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type CodeTab = "curl" | "javascript" | "python";

interface Param {
  name: string;
  in: "body" | "path" | "query";
  type: "string" | "number" | "select" | "textarea";
  required: boolean;
  description: string;
  placeholder?: string;
  options?: string[];
}

interface Endpoint {
  id: string;
  group: string;
  method: HttpMethod;
  path: string; // may contain :param_name tokens
  summary: string;
  description: string;
  params: Param[];
  sampleResponse: unknown;
}

// ── Endpoint definitions ──────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  {
    id: "ping",
    group: "Connectivity",
    method: "GET",
    path: "/sandbox/ping",
    summary: "Check sandbox status",
    description:
      "Verifies that the sandbox is reachable and your API key is valid. Use this as a first step to confirm your integration is set up correctly.",
    params: [],
    sampleResponse: {
      object: "sandbox_status",
      status: "ok",
      environment: "sandbox",
      key_label: "Local development",
      message:
        "The Fonlok sandbox is live. No real transactions will be processed.",
      timestamp: "2026-06-30T12:00:00.000Z",
      _sandbox: true,
    },
  },
  {
    id: "create-invoice",
    group: "Invoices",
    method: "POST",
    path: "/sandbox/invoices",
    summary: "Create a test invoice",
    description:
      "Creates a sandbox invoice. Use this to test the full payment lifecycle: create an invoice, initiate a payment against it, then confirm or fail the payment.",
    params: [
      {
        name: "title",
        in: "body",
        type: "string",
        required: true,
        description: "Invoice title or item description.",
        placeholder: "Design services – June 2026",
      },
      {
        name: "amount",
        in: "body",
        type: "number",
        required: true,
        description: "Amount in XAF. Must be greater than 0.",
        placeholder: "25000",
      },
      {
        name: "seller_email",
        in: "body",
        type: "string",
        required: true,
        description: "Email address of the seller.",
        placeholder: "seller@example.com",
      },
      {
        name: "buyer_email",
        in: "body",
        type: "string",
        required: false,
        description: "Email address of the buyer (optional).",
        placeholder: "buyer@example.com",
      },
      {
        name: "description",
        in: "body",
        type: "textarea",
        required: false,
        description: "Additional details about this invoice (optional).",
        placeholder: "Milestone 1 of 3 — initial design mockups.",
      },
    ],
    sampleResponse: {
      object: "sandbox_invoice",
      id: "inv_test_a1b2c3d4e5f6g7h8",
      title: "Design services – June 2026",
      description: null,
      amount: 25000,
      currency: "XAF",
      seller_email: "seller@example.com",
      buyer_email: null,
      status: "pending",
      created_at: "2026-06-30T12:00:00.000Z",
      updated_at: "2026-06-30T12:00:00.000Z",
      _sandbox: true,
    },
  },
  {
    id: "list-invoices",
    group: "Invoices",
    method: "GET",
    path: "/sandbox/invoices",
    summary: "List test invoices",
    description:
      "Returns a paginated list of all sandbox invoices created with this API key.",
    params: [
      {
        name: "limit",
        in: "query",
        type: "number",
        required: false,
        description: "Number of invoices to return (max 100, default 20).",
        placeholder: "20",
      },
      {
        name: "offset",
        in: "query",
        type: "number",
        required: false,
        description: "Number of records to skip for pagination.",
        placeholder: "0",
      },
    ],
    sampleResponse: {
      object: "list",
      data: [
        {
          id: "inv_test_a1b2c3d4e5f6g7h8",
          title: "Design services – June 2026",
          amount: 25000,
          currency: "XAF",
          status: "pending",
          created_at: "2026-06-30T12:00:00.000Z",
          _sandbox: true,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    },
  },
  {
    id: "get-invoice",
    group: "Invoices",
    method: "GET",
    path: "/sandbox/invoices/:invoice_id",
    summary: "Retrieve a test invoice",
    description: "Fetches a single sandbox invoice by its ID.",
    params: [
      {
        name: "invoice_id",
        in: "path",
        type: "string",
        required: true,
        description: "The invoice ID returned when you created the invoice.",
        placeholder: "inv_test_a1b2c3d4e5f6g7h8",
      },
    ],
    sampleResponse: {
      object: "sandbox_invoice",
      id: "inv_test_a1b2c3d4e5f6g7h8",
      title: "Design services – June 2026",
      description: null,
      amount: 25000,
      currency: "XAF",
      seller_email: "seller@example.com",
      buyer_email: null,
      status: "pending",
      created_at: "2026-06-30T12:00:00.000Z",
      updated_at: "2026-06-30T12:00:00.000Z",
      _sandbox: true,
    },
  },
  {
    id: "update-invoice",
    group: "Invoices",
    method: "PATCH",
    path: "/sandbox/invoices/:invoice_id",
    summary: "Update invoice status",
    description:
      "Advances a sandbox invoice through its lifecycle. Use this to simulate a buyer paying, a seller confirming delivery, or a cancellation without going through the payment flow.",
    params: [
      {
        name: "invoice_id",
        in: "path",
        type: "string",
        required: true,
        description: "The invoice ID to update.",
        placeholder: "inv_test_a1b2c3d4e5f6g7h8",
      },
      {
        name: "status",
        in: "body",
        type: "select",
        required: true,
        description: "The new invoice status.",
        options: ["pending", "paid", "delivered", "cancelled", "disputed"],
      },
    ],
    sampleResponse: {
      object: "sandbox_invoice",
      id: "inv_test_a1b2c3d4e5f6g7h8",
      title: "Design services – June 2026",
      amount: 25000,
      currency: "XAF",
      status: "paid",
      updated_at: "2026-06-30T12:05:00.000Z",
      _sandbox: true,
    },
  },
  {
    id: "initiate-payment",
    group: "Payments",
    method: "POST",
    path: "/sandbox/payments/initiate",
    summary: "Initiate a test payment",
    description:
      "Simulates sending a Mobile Money prompt to a phone number. Returns a reference you use to confirm or fail the payment. No real prompt is sent.",
    params: [
      {
        name: "invoice_id",
        in: "body",
        type: "string",
        required: true,
        description: "The sandbox invoice ID to pay.",
        placeholder: "inv_test_a1b2c3d4e5f6g7h8",
      },
      {
        name: "phone_number",
        in: "body",
        type: "string",
        required: true,
        description:
          "Cameroonian phone number in international format (237XXXXXXXXX).",
        placeholder: "237670000000",
      },
      {
        name: "amount",
        in: "body",
        type: "number",
        required: true,
        description: "Amount to charge in XAF.",
        placeholder: "25000",
      },
    ],
    sampleResponse: {
      object: "sandbox_payment",
      transaction_id: "txn_test_b2c3d4e5f6g7h8i9",
      reference: "ref_test_c3d4e5f6g7h8i9j0",
      invoice_id: "inv_test_a1b2c3d4e5f6g7h8",
      amount: 25000,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      status: "pending",
      message:
        "Sandbox: A simulated MTN Mobile Money prompt was sent to 237670000000. No real money moved.",
      _sandbox: true,
      _next_steps: {
        confirm: "POST /sandbox/payments/ref_test_c3d4e5f6g7h8i9j0/confirm",
        fail: "POST /sandbox/payments/ref_test_c3d4e5f6g7h8i9j0/fail",
      },
    },
  },
  {
    id: "confirm-payment",
    group: "Payments",
    method: "POST",
    path: "/sandbox/payments/:reference/confirm",
    summary: "Confirm a test payment",
    description:
      "Marks a pending sandbox payment as successful and updates the linked invoice to 'paid'. Simulates the customer accepting the Mobile Money prompt.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description: "The payment reference returned from the initiate step.",
        placeholder: "ref_test_c3d4e5f6g7h8i9j0",
      },
    ],
    sampleResponse: {
      object: "sandbox_payment",
      id: "txn_test_b2c3d4e5f6g7h8i9",
      invoice_id: "inv_test_a1b2c3d4e5f6g7h8",
      amount: 25000,
      currency: "XAF",
      provider: "MTN",
      status: "success",
      reference: "ref_test_c3d4e5f6g7h8i9j0",
      message:
        "Sandbox: Payment confirmed. The linked invoice has been updated to 'paid'.",
      _sandbox: true,
    },
  },
  {
    id: "fail-payment",
    group: "Payments",
    method: "POST",
    path: "/sandbox/payments/:reference/fail",
    summary: "Fail a test payment",
    description:
      "Marks a pending sandbox payment as failed. Simulates the customer declining, a timeout, or insufficient funds.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description: "The payment reference to fail.",
        placeholder: "ref_test_c3d4e5f6g7h8i9j0",
      },
      {
        name: "reason",
        in: "body",
        type: "string",
        required: false,
        description: "Optional failure reason for testing your error handling.",
        placeholder: "Insufficient balance.",
      },
    ],
    sampleResponse: {
      object: "sandbox_payment",
      id: "txn_test_b2c3d4e5f6g7h8i9",
      status: "failed",
      failure_reason: "Insufficient balance.",
      _sandbox: true,
      message: "Sandbox: Payment failed.",
    },
  },
  // ── Standalone MoMo ────────────────────────────────────────────────────────
  {
    id: "momo-charge",
    group: "MoMo (standalone)",
    method: "POST",
    path: "/sandbox/momo/charge",
    summary: "Simulate a MoMo charge",
    description:
      "Simulates a Mobile Money charge directly — no invoice required. Use this when you are building a payment-only integration (e.g. a checkout, utility bill payment, or subscription) and do not need the escrow flow. Works for both MTN and Orange Money. Returns a reference to confirm or fail.",
    params: [
      {
        name: "phone_number",
        in: "body",
        type: "string",
        required: true,
        description:
          "Cameroonian phone number in international format. 237 67x/68x = MTN. 237 66x = Orange. 237 69x range split by 6th digit.",
        placeholder: "237670000000",
      },
      {
        name: "amount",
        in: "body",
        type: "number",
        required: true,
        description: "Amount to charge in XAF.",
        placeholder: "5000",
      },
      {
        name: "description",
        in: "body",
        type: "string",
        required: false,
        description: "Optional label for this charge (e.g. order reference).",
        placeholder: "Order #1042",
      },
    ],
    sampleResponse: {
      object: "sandbox_momo_charge",
      transaction_id: "txn_test_d4e5f6g7h8i9j0k1",
      reference: "ref_test_e5f6g7h8i9j0k1l2",
      amount: 5000,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      description: "Order #1042",
      status: "pending",
      message:
        "Sandbox: A simulated MTN Mobile Money prompt was sent to 237670000000. No real money moved.",
      _sandbox: true,
      _next_steps: {
        confirm: "POST /sandbox/momo/ref_test_e5f6g7h8i9j0k1l2/confirm",
        fail: "POST /sandbox/momo/ref_test_e5f6g7h8i9j0k1l2/fail",
      },
    },
  },
  {
    id: "momo-confirm",
    group: "MoMo (standalone)",
    method: "POST",
    path: "/sandbox/momo/:reference/confirm",
    summary: "Confirm a MoMo charge",
    description:
      "Marks a pending standalone MoMo charge as successful. Simulates the customer accepting the Mobile Money prompt on their phone.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description: "The reference returned from POST /sandbox/momo/charge.",
        placeholder: "ref_test_e5f6g7h8i9j0k1l2",
      },
    ],
    sampleResponse: {
      object: "sandbox_momo_charge",
      id: "txn_test_d4e5f6g7h8i9j0k1",
      amount: 5000,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      status: "success",
      reference: "ref_test_e5f6g7h8i9j0k1l2",
      _sandbox: true,
      message: "Sandbox: MoMo charge confirmed. No real money moved.",
    },
  },
  {
    id: "momo-fail",
    group: "MoMo (standalone)",
    method: "POST",
    path: "/sandbox/momo/:reference/fail",
    summary: "Fail a MoMo charge",
    description:
      "Marks a pending standalone MoMo charge as failed. Simulates a customer declining the prompt, a timeout, or insufficient balance.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description: "The reference to fail.",
        placeholder: "ref_test_e5f6g7h8i9j0k1l2",
      },
      {
        name: "reason",
        in: "body",
        type: "string",
        required: false,
        description: "Optional failure reason for testing your error handling.",
        placeholder: "Customer declined.",
      },
    ],
    sampleResponse: {
      object: "sandbox_momo_charge",
      id: "txn_test_d4e5f6g7h8i9j0k1",
      status: "failed",
      failure_reason: "Customer declined.",
      _sandbox: true,
      message: "Sandbox: MoMo charge failed.",
    },
  },
  {
    id: "list-transactions",
    group: "Transactions",
    method: "GET",
    path: "/sandbox/transactions",
    summary: "List test transactions",
    description:
      "Returns a paginated list of all sandbox transactions created with this API key. Includes both invoice-linked payments and standalone MoMo charges.",
    params: [
      {
        name: "limit",
        in: "query",
        type: "number",
        required: false,
        description: "Number of transactions to return (max 100, default 20).",
        placeholder: "20",
      },
    ],
    sampleResponse: {
      object: "list",
      data: [
        {
          id: "txn_test_b2c3d4e5f6g7h8i9",
          invoice_id: "inv_test_a1b2c3d4e5f6g7h8",
          amount: 25000,
          currency: "XAF",
          provider: "MTN",
          status: "success",
          reference: "ref_test_c3d4e5f6g7h8i9j0",
          _sandbox: true,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    },
  },
  {
    id: "get-transaction",
    group: "Transactions",
    method: "GET",
    path: "/sandbox/transactions/:transaction_id",
    summary: "Retrieve a test transaction",
    description: "Fetches a single sandbox transaction by its ID.",
    params: [
      {
        name: "transaction_id",
        in: "path",
        type: "string",
        required: true,
        description: "The transaction ID to retrieve.",
        placeholder: "txn_test_b2c3d4e5f6g7h8i9",
      },
    ],
    sampleResponse: {
      id: "txn_test_b2c3d4e5f6g7h8i9",
      invoice_id: "inv_test_a1b2c3d4e5f6g7h8",
      amount: 25000,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      status: "success",
      reference: "ref_test_c3d4e5f6g7h8i9j0",
      created_at: "2026-06-30T12:00:00.000Z",
      _sandbox: true,
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<HttpMethod, { bg: string; color: string }> = {
  GET: { bg: "#DCFCE7", color: "#15803D" },
  POST: { bg: "#DBEAFE", color: "#1D4ED8" },
  PATCH: { bg: "#FEF9C3", color: "#854D0E" },
  DELETE: { bg: "#FEE2E2", color: "#B91C1C" },
};

/** Escape a string for safe interpolation into a shell / code snippet. */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "'\\''");
}

/** Build the resolved URL with path params substituted. */
function resolveUrl(
  path: string,
  values: Record<string, string>,
  base: string,
): string {
  let resolved = path;
  for (const [k, v] of Object.entries(values)) {
    resolved = resolved.replace(`:${k}`, encodeURIComponent(v || `:${k}`));
  }
  const queryParams = ENDPOINTS.find((e) => e.path === path)?.params.filter(
    (p) => p.in === "query" && values[p.name],
  );
  if (queryParams && queryParams.length > 0) {
    const qs = new URLSearchParams(
      queryParams.map((p) => [p.name, values[p.name]] as [string, string]),
    ).toString();
    resolved += `?${qs}`;
  }
  return `${base}${resolved}`;
}

/** Generate code examples for the three supported languages. */
function generateCode(
  endpoint: Endpoint,
  apiKey: string,
  values: Record<string, string>,
): Record<CodeTab, string> {
  const key = apiKey || "sk_test_your_key_here";
  const url = resolveUrl(endpoint.path, values, API_URL);
  const bodyParams = endpoint.params.filter(
    (p) => p.in === "body" && values[p.name],
  );

  const bodyObj: Record<string, string | number> = {};
  bodyParams.forEach((p) => {
    bodyObj[p.name] =
      p.type === "number" ? parseFloat(values[p.name]) || 0 : values[p.name];
  });
  const hasBody =
    ["POST", "PATCH"].includes(endpoint.method) && bodyParams.length > 0;
  const bodyJson = hasBody ? JSON.stringify(bodyObj, null, 2) : null;

  const curl = [
    `curl -X ${endpoint.method} \\`,
    `  "${url}" \\`,
    `  -H "Authorization: Bearer ${esc(key)}"`,
    hasBody && `  -H "Content-Type: application/json" \\`,
    hasBody && `  -d '${JSON.stringify(bodyObj)}'`,
  ]
    .filter(Boolean)
    .join("\n");

  const js = [
    `const response = await fetch("${url}", {`,
    `  method: "${endpoint.method}",`,
    `  headers: {`,
    `    "Authorization": "Bearer ${esc(key)}",`,
    hasBody && `    "Content-Type": "application/json",`,
    `  },`,
    hasBody && `  body: JSON.stringify(${bodyJson}),`,
    `});`,
    ``,
    `const data = await response.json();`,
    `console.log(data);`,
  ]
    .filter((l) => l !== false)
    .join("\n");

  const python = [
    `import requests`,
    ``,
    `headers = {`,
    `    "Authorization": "Bearer ${esc(key)}",`,
    hasBody && `    "Content-Type": "application/json",`,
    `}`,
    ``,
    hasBody && `payload = ${JSON.stringify(bodyObj, null, 4)}`,
    ``,
    `response = requests.${endpoint.method.toLowerCase()}(`,
    `    "${url}",`,
    `    headers=headers,`,
    hasBody && `    json=payload,`,
    `)`,
    ``,
    `print(response.json())`,
  ]
    .filter((l) => l !== false)
    .join("\n");

  return { curl, javascript: js, python };
}

/**
 * Syntax-highlight a JSON value by annotating it with HTML spans.
 * Input is a JS value (object/array/primitive), output is an HTML string
 * safe to render via dangerouslySetInnerHTML.
 *
 * Security: JSON.stringify escapes all special characters, and we HTML-
 * encode the output before applying span tags, so there is no XSS risk.
 */
function highlightJson(value: unknown): string {
  const raw = JSON.stringify(value, null, 2);
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[0-9a-f]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let color = "#D19A66"; // number
      if (/^"/.test(match)) {
        color = /:$/.test(match) ? "#61AFEF" : "#98C379";
      } else if (/true|false/.test(match)) {
        color = "#56B6C2";
      } else if (match === "null") {
        color = "#E06C75";
      }
      return `<span style="color:${color}">${match}</span>`;
    },
  );
}

// ── Groups ────────────────────────────────────────────────────────────────────

const GROUPS = ["Connectivity", "Invoices", "Payments", "MoMo (standalone)", "Transactions"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SandboxExplorer() {
  const [selectedId, setSelectedId] = useState<string>("ping");
  const [apiKey, setApiKey] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [codeTab, setCodeTab] = useState<CodeTab>("curl");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    data: unknown;
    ms: number;
  } | null>(null);

  const endpoint = ENDPOINTS.find((e) => e.id === selectedId)!;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setFieldValues({});
    setResponse(null);
    setCodeTab("curl");
  }, []);

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = async () => {
    if (!apiKey.trim()) {
      alert("Enter your sandbox API key in the field at the top first.");
      return;
    }
    setLoading(true);
    setResponse(null);

    // Build URL with path params resolved.
    let url = `${API_URL}${endpoint.path}`;
    endpoint.params
      .filter((p) => p.in === "path")
      .forEach((p) => {
        url = url.replace(
          `:${p.name}`,
          encodeURIComponent(fieldValues[p.name] || ""),
        );
      });

    // Append query params.
    const qp = endpoint.params.filter(
      (p) => p.in === "query" && fieldValues[p.name],
    );
    if (qp.length > 0) {
      const qs = new URLSearchParams(
        qp.map((p) => [p.name, fieldValues[p.name]] as [string, string]),
      ).toString();
      url += `?${qs}`;
    }

    // Build body.
    const bodyParams = endpoint.params.filter(
      (p) => p.in === "body" && fieldValues[p.name] !== undefined,
    );
    const bodyObj: Record<string, string | number> = {};
    bodyParams.forEach((p) => {
      if (fieldValues[p.name]) {
        bodyObj[p.name] =
          p.type === "number"
            ? parseFloat(fieldValues[p.name]) || 0
            : fieldValues[p.name];
      }
    });

    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          ...(["POST", "PATCH"].includes(endpoint.method) &&
          Object.keys(bodyObj).length > 0
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body:
          ["POST", "PATCH"].includes(endpoint.method) &&
          Object.keys(bodyObj).length > 0
            ? JSON.stringify(bodyObj)
            : undefined,
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = { error: "non_json_response", status: res.status };
      }

      setResponse({ status: res.status, data, ms: Date.now() - t0 });
    } catch (err) {
      setResponse({
        status: 0,
        data: {
          error: "network_error",
          message:
            err instanceof Error ? err.message : "Request failed. Check CORS and that the backend is running.",
        },
        ms: Date.now() - t0,
      });
    } finally {
      setLoading(false);
    }
  };

  const codes = generateCode(endpoint, apiKey, fieldValues);

  const statusColor = response
    ? response.status >= 500
      ? "#DC2626"
      : response.status >= 400
        ? "#D97706"
        : response.status >= 200
          ? "#16A34A"
          : "#6B7280"
    : null;

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "600px" }}>
      {/* ── Left sidebar: endpoint list ─────────────────────────────────────── */}
      <aside
        style={{
          width: "240px",
          flexShrink: 0,
          borderRight: "1px solid var(--color-border)",
          paddingRight: 0,
          position: "sticky",
          top: "80px",
          alignSelf: "flex-start",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
        className="hidden md:block"
      >
        {GROUPS.map((group) => {
          const groupEndpoints = ENDPOINTS.filter((e) => e.group === group);
          return (
            <div key={group} style={{ marginBottom: "0.25rem" }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  padding: "0.875rem 1.25rem 0.375rem",
                  margin: 0,
                }}
              >
                {group}
              </p>
              {groupEndpoints.map((e) => {
                const mc = METHOD_COLORS[e.method];
                const isActive = e.id === selectedId;
                return (
                  <button
                    key={e.id}
                    onClick={() => handleSelect(e.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.5rem 1.25rem",
                      background: isActive
                        ? "var(--color-primary-light)"
                        : "transparent",
                      border: "none",
                      borderRight: isActive
                        ? "3px solid var(--color-primary)"
                        : "3px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 800,
                        background: mc.bg,
                        color: mc.color,
                        padding: "0.15rem 0.375rem",
                        borderRadius: "4px",
                        letterSpacing: "0.04em",
                        flexShrink: 0,
                        minWidth: "34px",
                        textAlign: "center",
                      }}
                    >
                      {e.method}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? "var(--color-primary)"
                          : "var(--color-text-body)",
                        lineHeight: 1.4,
                      }}
                    >
                      {e.summary}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </aside>

      {/* ── Mobile endpoint selector ─────────────────────────────────────────── */}
      <div className="md:hidden" style={{ width: "100%", marginBottom: "1rem" }}>
        <select
          value={selectedId}
          onChange={(e) => handleSelect(e.target.value)}
          style={{
            width: "100%",
            padding: "0.625rem 0.875rem",
            borderRadius: "8px",
            border: "1.5px solid var(--color-border)",
            fontSize: "0.9rem",
            background: "#fff",
          }}
        >
          {GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {ENDPOINTS.filter((e) => e.group === group).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.method} — {e.summary}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ── Right panel: detail + try-it ─────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          paddingLeft: "2rem",
        }}
        className="md:pl-8 pl-0"
      >
        {/* API key bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            marginBottom: "1.75rem",
            background: "var(--color-mist)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.78125rem",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            Sandbox key
          </span>
          <div
            style={{
              flex: 1,
              minWidth: "200px",
              position: "relative",
            }}
          >
            <input
              type={keyVisible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_test_..."
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "100%",
                padding: "0.4rem 2.25rem 0.4rem 0.625rem",
                borderRadius: "6px",
                border: "1.5px solid var(--color-border)",
                fontSize: "0.875rem",
                fontFamily: "monospace",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setKeyVisible((v) => !v)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                padding: 0,
                display: "flex",
              }}
              aria-label={keyVisible ? "Hide key" : "Show key"}
            >
              {keyVisible ? (
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {apiKey && (
            <button
              onClick={() => setApiKey("")}
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Endpoint header */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              background: METHOD_COLORS[endpoint.method].bg,
              color: METHOD_COLORS[endpoint.method].color,
              padding: "0.3rem 0.75rem",
              borderRadius: "6px",
              letterSpacing: "0.04em",
            }}
          >
            {endpoint.method}
          </span>
          <code
            style={{
              fontSize: "0.9375rem",
              fontFamily: "monospace",
              color: "var(--color-text-heading)",
              fontWeight: 600,
            }}
          >
            {endpoint.path}
          </code>
        </div>
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-text-body)",
            lineHeight: 1.7,
            marginBottom: "1.75rem",
          }}
        >
          {endpoint.description}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
          className="explorer-grid"
        >
          {/* ── Left: request form ─────────────────────────────────────────── */}
          <div>
            {endpoint.params.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "0.78125rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: "1rem",
                  }}
                >
                  Parameters
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {endpoint.params.map((param) => (
                    <div key={param.name}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "0.375rem",
                          marginBottom: "0.375rem",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <code
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "var(--color-text-heading)",
                          }}
                        >
                          {param.name}
                        </code>
                        {param.required ? (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              background: "#FEE2E2",
                              color: "#DC2626",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                            }}
                          >
                            required
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            optional
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            background: "var(--color-mist)",
                            color: "var(--color-text-muted)",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "4px",
                          }}
                        >
                          {param.in}
                        </span>
                      </label>
                      <p
                        style={{
                          fontSize: "0.78125rem",
                          color: "var(--color-text-muted)",
                          marginBottom: "0.375rem",
                          lineHeight: 1.5,
                        }}
                      >
                        {param.description}
                      </p>
                      {param.type === "select" ? (
                        <select
                          value={fieldValues[param.name] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(param.name, e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "7px",
                            border: "1.5px solid var(--color-border)",
                            fontSize: "0.875rem",
                            background: "#fff",
                          }}
                        >
                          <option value="">Select status…</option>
                          {param.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : param.type === "textarea" ? (
                        <textarea
                          value={fieldValues[param.name] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(param.name, e.target.value)
                          }
                          placeholder={param.placeholder}
                          rows={3}
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "7px",
                            border: "1.5px solid var(--color-border)",
                            fontSize: "0.875rem",
                            resize: "vertical",
                            fontFamily: "inherit",
                            boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <input
                          type={param.type === "number" ? "number" : "text"}
                          value={fieldValues[param.name] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(param.name, e.target.value)
                          }
                          placeholder={param.placeholder}
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "7px",
                            border: "1.5px solid var(--color-border)",
                            fontSize: "0.875rem",
                            boxSizing: "border-box",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.7rem 1.5rem",
                borderRadius: "8px",
                background: loading ? "var(--color-primary-hover)" : "var(--color-primary)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9375rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    style={{ animation: "spin 0.8s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending…
                </>
              ) : (
                "Send request"
              )}
            </button>
          </div>

          {/* ── Right: code + response ──────────────────────────────────────── */}
          <div>
            {/* Code tabs */}
            <div
              style={{
                background: "#1E2029",
                borderRadius: "10px 10px 0 0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {(["curl", "javascript", "python"] as CodeTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCodeTab(tab)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "none",
                      border: "none",
                      borderBottom:
                        codeTab === tab
                          ? "2px solid var(--color-accent)"
                          : "2px solid transparent",
                      color:
                        codeTab === tab
                          ? "#fff"
                          : "rgba(255,255,255,0.4)",
                      fontSize: "0.78125rem",
                      fontWeight: codeTab === tab ? 700 : 400,
                      cursor: "pointer",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tab === "curl"
                      ? "cURL"
                      : tab === "javascript"
                        ? "JavaScript"
                        : "Python"}
                  </button>
                ))}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "1.25rem",
                  fontSize: "0.78125rem",
                  lineHeight: 1.8,
                  color: "#ABB2BF",
                  fontFamily: "'Courier New', Courier, monospace",
                  overflowX: "auto",
                  whiteSpace: "pre",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                {codes[codeTab]}
              </pre>
            </div>

            {/* Response panel */}
            <div
              style={{
                background: "#1E2029",
                borderRadius: "0 0 10px 10px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Response
                </span>
                {response && (
                  <>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: statusColor ?? "#fff",
                        background: "rgba(255,255,255,0.07)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      {response.status || "ERR"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {response.ms}ms
                    </span>
                  </>
                )}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "1.25rem",
                  fontSize: "0.78125rem",
                  lineHeight: 1.8,
                  fontFamily: "'Courier New', Courier, monospace",
                  overflowX: "auto",
                  maxHeight: "340px",
                  overflowY: "auto",
                  minHeight: "80px",
                  color: "#ABB2BF",
                }}
              >
                {response ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightJson(response.data),
                    }}
                  />
                ) : (
                  <span style={{ color: "rgba(255,255,255,0.18)" }}>
                    Click &ldquo;Send request&rdquo; to see the response here.
                    {"\n"}
                    The example below shows a sample response.
                  </span>
                )}
              </pre>
            </div>

            {/* Sample response (shown only before first request) */}
            {!response && (
              <div style={{ marginTop: "1rem" }}>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: "0.5rem",
                  }}
                >
                  Sample response
                </p>
                <pre
                  style={{
                    margin: 0,
                    padding: "1.25rem",
                    background: "#282C34",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    lineHeight: 1.8,
                    fontFamily: "'Courier New', Courier, monospace",
                    overflowX: "auto",
                    maxHeight: "280px",
                    overflowY: "auto",
                  }}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightJson(endpoint.sampleResponse),
                    }}
                  />
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .explorer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
