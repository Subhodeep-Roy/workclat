"""
Agent 3 — Fraud Agent
Vendor & Bank Authentication:
  - Cross-references invoice routing/account numbers against the Vendor Master File
  - Detects duplicate invoice numbers (same vendor submitting twice)
  - Triggers a critical alert on any mismatch — never silently passes
"""
from __future__ import annotations

# ── Vendor Master File (simulates MongoDB / ERP vendor master) ──────────────
# Real implementation: query MongoDB / vendor-management system.
# Keyed by normalised vendor name (lower-case).  Values are the VERIFIED banking details.
_VENDOR_MASTER: dict[str, dict] = {
    "techcorp":          {"routing": "021000021", "account_suffix": "4821", "aliases": ["techcorp inc", "techcorp inc."]},
    "logitrans global":  {"routing": "026009593", "account_suffix": "9102", "aliases": ["logitrans", "logitrans global ltd"]},
    "apex industries":   {"routing": "021000089", "account_suffix": "3344", "aliases": ["apex ind", "apex industries ltd"]},
    "acme supplies":     {"routing": "021000021", "account_suffix": "7711", "aliases": ["acme", "acme supply co"]},
    "cloudscale inc":    {"routing": "026009593", "account_suffix": "2255", "aliases": ["cloudscale", "cloud scale inc"]},
    "omnitech solutions":{"routing": "021000021", "account_suffix": "6699", "aliases": ["omnitech", "omni tech solutions"]},
}

# ── Seen invoice registry (duplicate detection) ──────────────────────────────
# In production this would live in a DB; here we use a module-level set.
_seen_invoice_numbers: set[str] = set()


def _lookup_vendor(vendor_name: str) -> dict | None:
    """Fuzzy-ish lookup: exact key match or alias match (case-insensitive)."""
    key = vendor_name.strip().lower()
    if key in _VENDOR_MASTER:
        return _VENDOR_MASTER[key]
    for canonical, data in _VENDOR_MASTER.items():
        if key in [a.lower() for a in data["aliases"]]:
            return data
    return None


def run_fraud_agent(payload) -> tuple[str | None, list[str]]:
    """
    Runs the fraud / bank-authentication pipeline.

    Returns
    -------
    (exception_status | None, notes)
        Returns None as status when the invoice clears all checks.
        Returns "exception_fraud" and fires a CRITICAL alert on any failure.
    """
    notes: list[str] = []

    # ── Check 1: Duplicate invoice number ────────────────────────────────────
    inv_no = payload.invoice_number.strip().upper()
    if inv_no in _seen_invoice_numbers:
        notes.append(
            f"Agent 3: ⚠️  CRITICAL — Duplicate invoice number {inv_no} detected! "
            "Possible double-billing or replay attack → exception_fraud"
        )
        return "exception_fraud", notes

    # ── Check 2: Vendor Master bank verification ──────────────────────────────
    vendor_record = _lookup_vendor(payload.vendor_name)

    if vendor_record is None:
        # Vendor not in master — could be new vendor or attempt to spoof a name
        notes.append(
            f"Agent 3: Vendor '{payload.vendor_name}' not found in Vendor Master File. "
            "Unverified vendor — cannot authenticate bank details → exception_fraud"
        )
        return "exception_fraud", notes

    # Compare routing number
    invoice_routing = (payload.vendor_routing or "").strip()
    master_routing  = vendor_record["routing"]
    if invoice_routing and invoice_routing != master_routing:
        notes.append(
            f"Agent 3: ⚠️  CRITICAL — Routing number mismatch! "
            f"Invoice: {invoice_routing} | Vendor Master: {master_routing} — "
            "possible payment redirection fraud → exception_fraud"
        )
        return "exception_fraud", notes

    # Compare account suffix (last 4 digits)
    invoice_account = (payload.vendor_bank_account or "").strip().lstrip("*")
    master_suffix   = vendor_record["account_suffix"]
    if invoice_account and not invoice_account.endswith(master_suffix):
        notes.append(
            f"Agent 3: ⚠️  CRITICAL — Bank account mismatch! "
            f"Invoice account ending '{invoice_account[-4:]}' does not match "
            f"Vendor Master '****{master_suffix}' → exception_fraud"
        )
        return "exception_fraud", notes

    # ── All checks passed ─────────────────────────────────────────────────────
    _seen_invoice_numbers.add(inv_no)   # register so duplicates are caught next time
    notes.append(
        f"Agent 3: Vendor '{payload.vendor_name}' verified in Vendor Master ✓"
    )
    if invoice_routing:
        notes.append(f"Agent 3: Routing {invoice_routing} matches Vendor Master ✓")
    if invoice_account:
        notes.append(f"Agent 3: Bank account ****{master_suffix} matches Vendor Master ✓")

    return None, notes
