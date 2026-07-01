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

// API_URL is used for live "Send request" calls — points to the real backend.
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// DOCS_API_URL is used only in generated code snippets (cURL, JS, Python).
// It defaults to the canonical public API base so that docs show a clean URL
// rather than a raw infrastructure URL (e.g. a Railway subdomain).
// Set NEXT_PUBLIC_API_DOCS_BASE_URL in your frontend env if your public API
// domain differs from NEXT_PUBLIC_API_BASE_URL.
const DOCS_API_URL =
  process.env.NEXT_PUBLIC_API_DOCS_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.fonlok.com";

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
      timestamp: "2026-07-01T12:00:00.000Z",
      _sandbox: true,
    },
  },
  {
    id: "token",
    group: "Connectivity",
    method: "POST",
    path: "/sandbox/token",
    summary: "Get a simulated access token",
    description:
      "Real MTN and Orange MoMo APIs require a Basic-auth token request before any API call. This endpoint returns a fake but realistic Bearer token so you can test your token-fetching and refresh logic without real credentials. The token grants no real access anywhere.",
    params: [],
    sampleResponse: {
      object: "sandbox_token",
      access_token: "access_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "profile payments",
      _sandbox: true,
      _note:
        "This token is simulated. It grants no access to real MTN or Orange APIs.",
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
    id: "momo-status",
    group: "MoMo (standalone)",
    method: "GET",
    path: "/sandbox/momo/:reference/status",
    summary: "Check transaction status",
    description:
      "Polls the current status of any sandbox MoMo transaction (charge or withdrawal) by its reference. Use this for polling-based integrations that check status after initiating a payment instead of relying on webhooks.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description:
          "The reference returned when you initiated the charge or withdrawal.",
        placeholder: "ref_test_e5f6g7h8i9j0k1l2",
      },
    ],
    sampleResponse: {
      object: "sandbox_transaction_status",
      id: "txn_test_d4e5f6g7h8i9j0k1",
      type: "charge",
      direction: "inbound",
      amount: 5000,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      description: null,
      status: "success",
      reference: "ref_test_e5f6g7h8i9j0k1l2",
      created_at: "2026-07-01T12:00:00.000Z",
      updated_at: "2026-07-01T12:01:00.000Z",
      _sandbox: true,
    },
  },
  {
    id: "momo-withdraw",
    group: "MoMo (standalone)",
    method: "POST",
    path: "/sandbox/momo/withdraw",
    summary: "Simulate a withdrawal/payout",
    description:
      "Simulates sending money FROM your application TO a phone number. This is the disbursement API — the reverse of a charge. Use cases: paying out sellers, sending refunds, distributing commissions. Both MTN and Orange are supported. Confirm or fail with the standard /confirm and /fail endpoints.",
    params: [
      {
        name: "phone_number",
        in: "body",
        type: "string",
        required: true,
        description: "The recipient phone number in international format.",
        placeholder: "237660000000",
      },
      {
        name: "amount",
        in: "body",
        type: "number",
        required: true,
        description: "Amount to disburse in XAF.",
        placeholder: "15000",
      },
      {
        name: "description",
        in: "body",
        type: "string",
        required: false,
        description: "Optional label (e.g. payout reference, seller name).",
        placeholder: "Seller payout — Invoice #1042",
      },
    ],
    sampleResponse: {
      object: "sandbox_withdrawal",
      transaction_id: "txn_test_f6g7h8i9j0k1l2m3",
      reference: "ref_test_g7h8i9j0k1l2m3n4",
      amount: 15000,
      currency: "XAF",
      provider: "ORANGE",
      phone_number: "237660000000",
      description: "Seller payout — Invoice #1042",
      direction: "outbound",
      status: "pending",
      message:
        "Sandbox: A simulated ORANGE disbursement of 15000 XAF to 237660000000 is pending. No real money moved.",
      _sandbox: true,
      _next_steps: {
        confirm: "POST /sandbox/momo/ref_test_g7h8i9j0k1l2m3n4/confirm",
        fail: "POST /sandbox/momo/ref_test_g7h8i9j0k1l2m3n4/fail",
        status: "GET /sandbox/momo/ref_test_g7h8i9j0k1l2m3n4/status",
      },
    },
  },
  {
    id: "momo-webhook",
    group: "MoMo (standalone)",
    method: "POST",
    path: "/sandbox/momo/webhook/simulate",
    summary: "Fire a simulated webhook",
    description:
      "Sends a simulated MoMo payment notification to your own callback URL. Use this to test your webhook handler end-to-end — the sandbox makes a real HTTP POST to your endpoint with a realistic payload. The format parameter lets you choose the MTN, Orange, or generic Fonlok payload shape. Your callback URL must be a publicly reachable address (internal network addresses are not accepted).",
    params: [
      {
        name: "reference",
        in: "body",
        type: "string",
        required: true,
        description: "The transaction reference to base the webhook on.",
        placeholder: "ref_test_e5f6g7h8i9j0k1l2",
      },
      {
        name: "callback_url",
        in: "body",
        type: "string",
        required: true,
        description: "Your publicly reachable webhook endpoint URL.",
        placeholder: "https://your-app.com/webhooks/momo",
      },
      {
        name: "format",
        in: "body",
        type: "select",
        required: false,
        description: "Payload shape to use. Defaults to generic.",
        options: ["generic", "mtn", "orange"],
      },
    ],
    sampleResponse: {
      object: "sandbox_webhook_delivery",
      status: "delivered",
      callback_url: "https://your-app.com/webhooks/momo",
      format: "mtn",
      response_http_status: 200,
      payload_sent: {
        financialTransactionId: "txn_test_d4e5f6g7h8i9j0k1",
        externalId: "ref_test_e5f6g7h8i9j0k1l2",
        amount: "5000",
        currency: "XAF",
        payer: { partyIdType: "MSISDN", partyId: "237670000000" },
        status: "SUCCESSFUL",
        _sandbox: true,
      },
      _sandbox: true,
    },
  },
  // ── Airtime ────────────────────────────────────────────────────────────────
  {
    id: "airtime-topup",
    group: "Airtime",
    method: "POST",
    path: "/sandbox/airtime/topup",
    summary: "Simulate an airtime top-up",
    description:
      "Simulates crediting airtime to a Cameroonian phone number. Useful for apps that offer airtime as a reward, cashback, or service. Supports both MTN and Orange. Amount must be between 100 and 50,000 XAF. No real airtime is credited.",
    params: [
      {
        name: "phone_number",
        in: "body",
        type: "string",
        required: true,
        description: "The recipient phone number.",
        placeholder: "237670000000",
      },
      {
        name: "amount",
        in: "body",
        type: "number",
        required: true,
        description: "Airtime amount in XAF (100–50,000).",
        placeholder: "500",
      },
      {
        name: "description",
        in: "body",
        type: "string",
        required: false,
        description: "Optional label (e.g. reward reference).",
        placeholder: "Loyalty reward",
      },
    ],
    sampleResponse: {
      object: "sandbox_airtime_topup",
      transaction_id: "txn_test_h8i9j0k1l2m3n4o5",
      reference: "ref_test_i9j0k1l2m3n4o5p6",
      amount: 500,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      description: "Loyalty reward",
      status: "pending",
      message:
        "Sandbox: A simulated MTN airtime top-up of 500 XAF to 237670000000 is pending. No real airtime will be credited.",
      _sandbox: true,
      _next_steps: {
        confirm: "POST /sandbox/airtime/ref_test_i9j0k1l2m3n4o5p6/confirm",
        fail: "POST /sandbox/airtime/ref_test_i9j0k1l2m3n4o5p6/fail",
        status: "GET /sandbox/airtime/ref_test_i9j0k1l2m3n4o5p6/status",
      },
    },
  },
  {
    id: "airtime-confirm",
    group: "Airtime",
    method: "POST",
    path: "/sandbox/airtime/:reference/confirm",
    summary: "Confirm an airtime top-up",
    description: "Marks a pending sandbox airtime top-up as successful.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description: "The reference returned from the top-up initiation.",
        placeholder: "ref_test_i9j0k1l2m3n4o5p6",
      },
    ],
    sampleResponse: {
      object: "sandbox_airtime_topup",
      id: "txn_test_h8i9j0k1l2m3n4o5",
      amount: 500,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      status: "success",
      reference: "ref_test_i9j0k1l2m3n4o5p6",
      _sandbox: true,
      message:
        "Sandbox: Airtime top-up confirmed. No real airtime was credited.",
    },
  },
  {
    id: "airtime-fail",
    group: "Airtime",
    method: "POST",
    path: "/sandbox/airtime/:reference/fail",
    summary: "Fail an airtime top-up",
    description:
      "Marks a pending sandbox airtime top-up as failed. Simulates a network error, invalid number, or provider refusal.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description: "The reference to fail.",
        placeholder: "ref_test_i9j0k1l2m3n4o5p6",
      },
      {
        name: "reason",
        in: "body",
        type: "string",
        required: false,
        description: "Optional failure reason.",
        placeholder: "Invalid phone number.",
      },
    ],
    sampleResponse: {
      object: "sandbox_airtime_topup",
      id: "txn_test_h8i9j0k1l2m3n4o5",
      status: "failed",
      failure_reason: "Invalid phone number.",
      _sandbox: true,
      message: "Sandbox: Airtime top-up failed.",
    },
  },
  {
    id: "airtime-status",
    group: "Airtime",
    method: "GET",
    path: "/sandbox/airtime/:reference/status",
    summary: "Check airtime top-up status",
    description:
      "Returns the current status of a sandbox airtime top-up by its reference.",
    params: [
      {
        name: "reference",
        in: "path",
        type: "string",
        required: true,
        description: "The airtime top-up reference.",
        placeholder: "ref_test_i9j0k1l2m3n4o5p6",
      },
    ],
    sampleResponse: {
      object: "sandbox_airtime_status",
      id: "txn_test_h8i9j0k1l2m3n4o5",
      type: "airtime",
      amount: 500,
      currency: "XAF",
      provider: "MTN",
      phone_number: "237670000000",
      description: "Loyalty reward",
      status: "success",
      reference: "ref_test_i9j0k1l2m3n4o5p6",
      _sandbox: true,
    },
  },
  {
    id: "list-transactions",
    group: "Transactions",
    method: "GET",
    path: "/sandbox/transactions",
    summary: "List test transactions",
    description:
      "Returns a paginated list of all sandbox transactions created with this API key. Includes invoice-linked payments, standalone MoMo charges, withdrawals, and airtime top-ups.",
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
  const url = resolveUrl(endpoint.path, values, DOCS_API_URL);
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

const GROUPS = [
  "Connectivity",
  "Invoices",
  "Payments",
  "MoMo (standalone)",
  "Airtime",
  "Transactions",
];

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

  // ── Copy state ────────────────────────────────────────────────────────────
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  const copyText = useCallback(
    (text: string, setter: (v: boolean) => void) => {
      navigator.clipboard.writeText(text).then(() => {
        setter(true);
        setTimeout(() => setter(false), 2000);
      });
    },
    [],
  );

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
            err instanceof Error
              ? err.message
              : "Request failed. Check CORS and that the backend is running.",
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
    <div style={{ display: "flex", gap: 0 }} className="sandbox-outer">
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
      <div
        className="md:hidden"
        style={{ width: "100%", marginBottom: "1rem" }}
      >
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
        }}
        className="sandbox-detail-panel"
      >
        {/* API key bar */}
        <div
          className="sandbox-key-bar"
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
            className="sandbox-key-input-wrap"
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
          }}
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
              flexShrink: 0,
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
              wordBreak: "break-all",
              overflowWrap: "break-word",
              minWidth: 0,
              flex: 1,
            }}
          >
            {endpoint.path}
          </code>
          <button
            type="button"
            onClick={() =>
              copyText(
                `${DOCS_API_URL}${endpoint.path}`,
                setCopiedPath,
              )
            }
            title="Copy full URL"
            style={{
              background: "none",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: copiedPath
                ? "#16A34A"
                : "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              flexShrink: 0,
              transition: "color 0.15s",
            }}
          >
            {copiedPath ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                Copied
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                Copy URL
              </>
            )}
          </button>
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
                background: loading
                  ? "var(--color-primary-hover)"
                  : "var(--color-primary)",
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
          <div className="explorer-right-panel" style={{ minWidth: 0 }}>
            {/* Code tabs */}
            <div
              style={{
                background: "#1E2029",
                borderRadius: "10px 10px 0 0",
                overflow: "hidden",
              }}
            >
              <div
                className="code-tabs-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ display: "flex", flex: 1 }}>
                  {(["curl", "javascript", "python"] as CodeTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCodeTab(tab)}
                      className="code-tab-btn"
                      style={{
                        padding: "0.5rem 1rem",
                        background: "none",
                        border: "none",
                        borderBottom:
                          codeTab === tab
                            ? "2px solid var(--color-accent)"
                            : "2px solid transparent",
                        color: codeTab === tab ? "#fff" : "rgba(255,255,255,0.4)",
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
                <button
                  type="button"
                  onClick={() => copyText(codes[codeTab], setCopiedCode)}
                  title="Copy code"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.375rem 0.75rem",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: copiedCode ? "#4ADE80" : "rgba(255,255,255,0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    flexShrink: 0,
                    transition: "color 0.15s",
                  }}
                >
                  {copiedCode ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre
                className="explorer-code-block"
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
                  maxWidth: "100%",
                  boxSizing: "border-box",
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
                className="response-header-row"
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
                {response && (
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        JSON.stringify(response.data, null, 2),
                        setCopiedResponse,
                      )
                    }
                    title="Copy response"
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: copiedResponse
                        ? "#4ADE80"
                        : "rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "color 0.15s",
                    }}
                  >
                    {copiedResponse ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <pre
                className="explorer-response-block"
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
                  maxWidth: "100%",
                  boxSizing: "border-box",
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    Sample response
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        JSON.stringify(endpoint.sampleResponse, null, 2),
                        setCopiedSample,
                      )
                    }
                    title="Copy sample response"
                    style={{
                      background: "none",
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: copiedSample
                        ? "#16A34A"
                        : "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "color 0.15s",
                    }}
                  >
                    {copiedSample ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre
                  className="explorer-sample-block"
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
                    maxWidth: "100%",
                    boxSizing: "border-box",
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

        /* Prevent horizontal overflow on all screen sizes */
        .sandbox-outer {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .explorer-right-panel {
          min-width: 0;
          max-width: 100%;
        }
        .explorer-code-block,
        .explorer-response-block,
        .explorer-sample-block {
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Desktop: sidebar visible, right panel indented */
        @media (min-width: 769px) {
          .sandbox-outer { min-height: 600px; }
          .sandbox-detail-panel { padding-left: 2rem; }
        }

        /* Mobile: stack everything vertically, no left gap */
        @media (max-width: 768px) {
          .sandbox-outer {
            flex-direction: column;
          }
          .sandbox-detail-panel {
            padding-left: 0;
            padding-top: 1.25rem;
            min-width: 0;
            width: 100%;
          }
          .sandbox-key-bar {
            align-items: stretch;
          }
          .sandbox-key-input-wrap {
            min-width: 0 !important;
            width: 100%;
          }
          .explorer-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .explorer-right-panel {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
          }
          .explorer-code-block,
          .explorer-response-block,
          .explorer-sample-block {
            width: 100%;
          }
          .code-tabs-row {
            overflow-x: auto;
            white-space: nowrap;
            scrollbar-width: thin;
          }
          .code-tab-btn {
            flex-shrink: 0;
          }
          .response-header-row {
            flex-wrap: wrap;
            row-gap: 0.35rem;
          }
        }
        @media (max-width: 480px) {
          .sandbox-key-bar {
            gap: 0.5rem;
            padding: 0.625rem 0.75rem;
          }
          .explorer-code-block,
          .explorer-response-block,
          .explorer-sample-block {
            padding: 0.875rem !important;
            font-size: 0.72rem !important;
            line-height: 1.55 !important;
          }
        }
      `}</style>
    </div>
  );
}
