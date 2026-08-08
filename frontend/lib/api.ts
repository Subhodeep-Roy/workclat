const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ── Agent 1: Confidence scores per extracted field ──────────────────────────
export type ConfidenceScore = {
  vendor_name: number;
  total_amount: number;
  invoice_number: number;
  line_items: number;
  overall: number;
};

// ── Line item ────────────────────────────────────────────────────────────────
export type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

// ── Full invoice type (all 6 agents contribute fields) ──────────────────────
export type Invoice = {
  id: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  po_number: string | null;
  grn_number: string | null;
  vendor_bank_account: string | null;
  vendor_routing: string | null;
  department: string;
  status: string;
  confidence: ConfidenceScore | null;
  agent_notes: string[];
  created_at: string;
};

// ── Approval record (Agent 5) ────────────────────────────────────────────────
export type Approval = {
  id: string;
  invoice_id: string;
  approver_id: string;
  decision: string;
  reason: string | null;
  exception_type: string | null;
  exception_context: string | null;  // "Unit price exceeds PO by 8%"
  department: string | null;
  invoice_amount: number | null;
  requested_at: string;
  decided_at: string | null;
};

// ── Payment batch (Agent 6) ──────────────────────────────────────────────────
export type BatchInvoiceItem = {
  invoice_id: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  department: string;
  bank_account: string | null;
  routing: string | null;
};

export type PaymentBatch = {
  id: string;
  created_at: string;
  status: string;          // "ready_for_release" | "released" | "cancelled"
  invoice_count: number;
  total_amount: number;
  items: BatchInvoiceItem[];
  released_by: string | null;
  released_at: string | null;
  notes: string[];
};

// ── Generic fetch helper ─────────────────────────────────────────────────────
export async function fetchJson<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vendorflow-token') : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

// ── POST helper ──────────────────────────────────────────────────────────────
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vendorflow-token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };
