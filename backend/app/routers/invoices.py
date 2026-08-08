"""
Agent 1 — Invoice Agent
Handles ingestion, field extraction, confidence scoring, and 95% threshold routing.
"""
from __future__ import annotations
import random
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from .auth import get_current_user, UserProfile

router = APIRouter(prefix="/invoices", tags=["invoices"])


# ── Data models ───────────────────────────────────────────────────────────────

class LineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total: float

class ConfidenceScore(BaseModel):
    vendor_name: float      # 0-1
    total_amount: float
    invoice_number: float
    line_items: float
    overall: float          # min of above — gates the 95% threshold

class InvoiceCreate(BaseModel):
    invoice_number: str = Field(...)
    vendor_name:    str = Field(...)
    total_amount:   float = Field(...)
    po_number:      str | None = Field(default=None)
    grn_number:     str | None = Field(default=None)
    vendor_bank_account: str | None = Field(default=None)
    vendor_routing:      str | None = Field(default=None)
    department:     str | None = Field(default="General")
    line_items:     list[LineItem] = Field(default_factory=list)
    status:         str = Field(default="uploaded")

class InvoiceResponse(BaseModel):
    id:              str
    invoice_number:  str
    vendor_name:     str
    total_amount:    float
    po_number:       str | None = None
    grn_number:      str | None = None
    vendor_bank_account: str | None = None
    vendor_routing:      str | None = None
    department:      str = "General"
    status:          str
    confidence:      ConfidenceScore | None = None
    agent_notes:     list[str] = Field(default_factory=list)
    created_at:      str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ── Helpers ───────────────────────────────────────────────────────────────────

CONFIDENCE_THRESHOLD = 0.95

def _simulate_confidence(invoice: InvoiceCreate) -> ConfidenceScore:
    """
    Simulate OCR confidence scoring.
    Real implementation: replace with OCR engine output scores.
    """
    base = random.uniform(0.88, 0.99)
    scores = {
        "vendor_name":    round(min(1.0, base + random.uniform(-0.04, 0.04)), 3),
        "total_amount":   round(min(1.0, base + random.uniform(-0.04, 0.04)), 3),
        "invoice_number": round(min(1.0, base + random.uniform(-0.02, 0.02)), 3),
        "line_items":     round(min(1.0, base + random.uniform(-0.06, 0.02)), 3),
    }
    scores["overall"] = round(min(scores.values()), 3)
    return ConfidenceScore(**scores)


# ── Seeded data ───────────────────────────────────────────────────────────────

_seeded: list[InvoiceResponse] = [
    InvoiceResponse(
        id="inv-001", invoice_number="INV-882", vendor_name="TechCorp",
        total_amount=5400.00,  po_number="PO-1042", grn_number="GRN-881",
        vendor_bank_account="****4821", vendor_routing="021000021",
        department="Engineering", status="exception_price",
        confidence=ConfidenceScore(vendor_name=0.98, total_amount=0.97,
                                   invoice_number=0.99, line_items=0.96, overall=0.96),
        agent_notes=["Agent 1: OCR confidence OK (0.96)",
                     "Agent 2: Unit price exceeds PO by 8% → exception_price",
                     "Agent 5: Routed to Engineering head for approval"],
    ),
    InvoiceResponse(
        id="inv-002", invoice_number="INV-3920", vendor_name="LogiTrans Global",
        total_amount=12850.00, po_number="PO-3100", grn_number=None,
        vendor_bank_account="****9102", vendor_routing="026009593",
        department="Operations", status="exception_grn",
        confidence=ConfidenceScore(vendor_name=0.97, total_amount=0.98,
                                   invoice_number=0.97, line_items=0.95, overall=0.95),
        agent_notes=["Agent 1: OCR confidence OK (0.95)",
                     "Agent 2: GRN not found — goods not confirmed received → exception_grn",
                     "Agent 5: Routed to Operations head for GRN verification"],
    ),
    InvoiceResponse(
        id="inv-003", invoice_number="INV-9912", vendor_name="Apex Industries",
        total_amount=3200.00, po_number="PO-9800", grn_number="GRN-9905",
        vendor_bank_account="****3344", vendor_routing="021000089",
        department="Finance", status="exception_tax",
        confidence=ConfidenceScore(vendor_name=0.96, total_amount=0.95,
                                   invoice_number=0.97, line_items=0.93, overall=0.93),
        agent_notes=["Agent 1: Low confidence on line_items (0.93) — flagged",
                     "Agent 2: Tax code mismatch vs PO → exception_tax",
                     "Agent 5: Routed to Finance head"],
    ),
    InvoiceResponse(
        id="inv-004", invoice_number="INV-1029", vendor_name="Acme Supplies",
        total_amount=1450.00, po_number="PO-1001", grn_number="GRN-1028",
        vendor_bank_account="****7711", vendor_routing="021000021",
        department="Procurement", status="approved",
        confidence=ConfidenceScore(vendor_name=0.99, total_amount=0.99,
                                   invoice_number=0.99, line_items=0.98, overall=0.98),
        agent_notes=["Agent 1: OCR confidence OK (0.98)",
                     "Agent 2: 3-way match passed (Invoice ✓ PO ✓ GRN ✓)",
                     "Agent 3: Bank account matches Vendor Master ✓",
                     "Agent 4: Variance $14 on $1450 — within 1% tolerance — auto-approved",
                     "Agent 5: Clean invoice — bypassed exception routing"],
    ),
    InvoiceResponse(
        id="inv-005", invoice_number="INV-8831", vendor_name="CloudScale Inc",
        total_amount=8900.00, po_number="PO-8800", grn_number="GRN-8820",
        vendor_bank_account="****2255", vendor_routing="026009593",
        department="Infrastructure", status="approved",
        confidence=ConfidenceScore(vendor_name=0.98, total_amount=0.97,
                                   invoice_number=0.98, line_items=0.96, overall=0.96),
        agent_notes=["Agent 1: OCR confidence OK (0.96)",
                     "Agent 2: 3-way match passed ✓",
                     "Agent 3: Bank account matches Vendor Master ✓",
                     "Agent 4: No variance detected",
                     "Agent 5: Clean — bypassed exception routing"],
    ),
    InvoiceResponse(
        id="inv-006", invoice_number="INV-4011", vendor_name="OmniTech Solutions",
        total_amount=2100.00, po_number="PO-4000", grn_number="GRN-4010",
        vendor_bank_account="****6699", vendor_routing="021000021",
        department="IT", status="approved",
        confidence=ConfidenceScore(vendor_name=0.97, total_amount=0.98,
                                   invoice_number=0.99, line_items=0.97, overall=0.97),
        agent_notes=["Agent 1: OCR confidence OK (0.97)",
                     "Agent 2: 3-way match passed ✓",
                     "Agent 3: Bank account matches Vendor Master ✓",
                     "Agent 4: $12 shipping variance on $2100 — within 1% tolerance — auto-approved",
                     "Agent 5: Clean — bypassed exception routing"],
    ),
]

invoices_db: dict[str, list[InvoiceResponse]] = {
    "admin@vendorflow.ai": list(_seeded),
}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[InvoiceResponse])
def list_invoices(current_user: UserProfile = Depends(get_current_user)):
    return invoices_db.get(current_user.email, [])


@router.post("", response_model=InvoiceResponse, status_code=201)
def create_invoice(payload: InvoiceCreate, current_user: UserProfile = Depends(get_current_user)):
    """
    Agent 1 — Invoice Agent pipeline:
    1. Assign confidence scores to all extracted fields
    2. If overall confidence < 95% → divert to manual_review
    3. Otherwise hand off to downstream agents (validation, fraud, budget)
    """
    from .validation import run_validation_agent
    from .fraud     import run_fraud_agent
    from .budget    import run_budget_agent
    from .approvals import create_approval_from_pipeline

    user_invoices = invoices_db.setdefault(current_user.email, [])
    invoice_id = f"inv-{str(uuid.uuid4())[:8]}"
    notes: list[str] = []

    # ── Agent 1: Confidence scoring ──
    confidence = _simulate_confidence(payload)
    if confidence.overall < CONFIDENCE_THRESHOLD:
        notes.append(f"Agent 1: Low OCR confidence ({confidence.overall}) — diverted to manual review")
        invoice = InvoiceResponse(
            id=invoice_id, **payload.model_dump(),
            status="manual_review", confidence=confidence, agent_notes=notes,
        )
        user_invoices.append(invoice)
        return invoice

    notes.append(f"Agent 1: OCR confidence OK ({confidence.overall})")

    # ── Agent 2: Validation (3-way match) ──
    status, validation_notes = run_validation_agent(payload)
    notes.extend(validation_notes)

    # ── Agent 3: Fraud check (bank auth) — only if validation passed ──
    if status not in ("exception_grn", "exception_po"):
        fraud_status, fraud_notes = run_fraud_agent(payload)
        notes.extend(fraud_notes)
        if fraud_status:
            status = fraud_status

    # ── Agent 4: Budget / variance check — only if no exception yet ──
    if status == "uploaded":
        budget_status, budget_notes = run_budget_agent(payload)
        notes.extend(budget_notes)
        if budget_status:
            status = budget_status

    # ── Agent 5: Route or clear ──
    if status == "uploaded":
        status = "approved"
        notes.append("Agent 5: All checks passed — invoice cleared for payment batch")
    else:
        notes.append(
            f"Agent 5: Exception detected ({status}) — packaged with context and "
            f"routed to {payload.department or 'Finance'} head for resolution"
        )

    invoice = InvoiceResponse(
        id=invoice_id, **payload.model_dump(),
        status=status, confidence=confidence, agent_notes=notes,
    )
    user_invoices.append(invoice)

    # ── Agent 5: Create approval routing record for exceptions ──
    create_approval_from_pipeline(
        invoice_id=invoice_id,
        status=status,
        department=payload.department or "General",
        invoice_amount=payload.total_amount,
        agent_notes=notes,
        user_email=current_user.email,
    )

    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, current_user: UserProfile = Depends(get_current_user)):
    for inv in invoices_db.get(current_user.email, []):
        if inv.id == invoice_id:
            return inv
    raise HTTPException(status_code=404, detail="Invoice not found")


@router.patch("/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(invoice_id: str, body: dict, current_user: UserProfile = Depends(get_current_user)):
    """Human override — force_approved / rejected by reviewer."""
    for inv in invoices_db.get(current_user.email, []):
        if inv.id == invoice_id:
            inv.status = body.get("status", inv.status)
            inv.agent_notes.append(f"Human override: status → {inv.status}")
            return inv
    raise HTTPException(status_code=404, detail="Invoice not found")
