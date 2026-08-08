"""
Agent 2 — Validation Agent
3-Way Match: Invoice vs. Purchase Order vs. Goods Receipt Note (GRN).
Only clears an invoice when all three documents are present and aligned.
"""
from __future__ import annotations

# ── Simulated ERP / PO database ─────────────────────────────────────────────
# Real implementation: query your ERP (SAP, Oracle, NetSuite, etc.) via API.
# Each entry: po_number → { expected_total, currency, grn_numbers: [str], department }
_PO_DATABASE: dict[str, dict] = {
    "PO-1042": {"expected_total": 5000.00,  "currency": "USD", "grn_numbers": ["GRN-881"],  "department": "Engineering"},
    "PO-3100": {"expected_total": 12850.00, "currency": "USD", "grn_numbers": [],            "department": "Operations"},
    "PO-9800": {"expected_total": 3200.00,  "currency": "USD", "grn_numbers": ["GRN-9905"], "department": "Finance"},
    "PO-1001": {"expected_total": 1450.00,  "currency": "USD", "grn_numbers": ["GRN-1028"], "department": "Procurement"},
    "PO-8800": {"expected_total": 8900.00,  "currency": "USD", "grn_numbers": ["GRN-8820"], "department": "Infrastructure"},
    "PO-4000": {"expected_total": 2100.00,  "currency": "USD", "grn_numbers": ["GRN-4010"], "department": "IT"},
}

# Price-variance tolerance: invoices within this % above the PO total are auto-approved.
PRICE_VARIANCE_THRESHOLD = 0.05   # 5% — above this → exception_price


def run_validation_agent(payload) -> tuple[str, list[str]]:
    """
    Runs the 3-way match pipeline.

    Returns
    -------
    (status, notes)
        status: "uploaded" (pass) | "exception_po" | "exception_grn" | "exception_price"
        notes:  list of human-readable agent log lines
    """
    notes: list[str] = []
    status = "uploaded"

    # ── Step 1: PO presence check ────────────────────────────────────────────
    if not payload.po_number:
        notes.append("Agent 2: No PO number on invoice — cannot perform 3-way match → exception_po")
        return "exception_po", notes

    po = _PO_DATABASE.get(payload.po_number)
    if po is None:
        notes.append(f"Agent 2: PO {payload.po_number} not found in ERP — unrecognised purchase order → exception_po")
        return "exception_po", notes

    notes.append(f"Agent 2: PO {payload.po_number} located in ERP ✓")

    # ── Step 2: GRN presence check (goods physically received?) ─────────────
    if not payload.grn_number:
        notes.append(
            f"Agent 2: GRN missing on invoice for PO {payload.po_number} — "
            "goods receipt not confirmed → exception_grn"
        )
        return "exception_grn", notes

    if payload.grn_number not in po["grn_numbers"]:
        notes.append(
            f"Agent 2: GRN {payload.grn_number} not matched to PO {payload.po_number} in ERP — "
            "goods may not have been received → exception_grn"
        )
        return "exception_grn", notes

    notes.append(f"Agent 2: GRN {payload.grn_number} confirmed — goods physically received ✓")

    # ── Step 3: Price variance check ─────────────────────────────────────────
    expected = po["expected_total"]
    actual   = payload.total_amount
    if expected > 0:
        variance_pct = (actual - expected) / expected
    else:
        variance_pct = 0.0

    if variance_pct > PRICE_VARIANCE_THRESHOLD:
        pct_str = f"{variance_pct * 100:.1f}%"
        notes.append(
            f"Agent 2: Invoice total ${actual:,.2f} exceeds PO expected ${expected:,.2f} "
            f"by {pct_str} (>{int(PRICE_VARIANCE_THRESHOLD * 100)}% tolerance) → exception_price"
        )
        return "exception_price", notes

    if variance_pct > 0:
        notes.append(
            f"Agent 2: Minor price variance ${actual - expected:,.2f} "
            f"({variance_pct * 100:.1f}%) — within tolerance ✓"
        )
    else:
        notes.append(f"Agent 2: Amount exactly matches PO ${expected:,.2f} ✓")

    notes.append("Agent 2: 3-way match passed (Invoice ✓ PO ✓ GRN ✓)")
    return status, notes
