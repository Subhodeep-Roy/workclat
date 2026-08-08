"""
Agent 5 — Approval Agent
Exception Routing:
  - Clean invoices bypass this entirely
  - Invoices with major variances, missing GRNs, or failed bank checks are
    packaged with full context and routed to the correct department head
  - Context includes why it was flagged, the specific exception type, and amounts
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime

from .auth import get_current_user, UserProfile

router = APIRouter(prefix="/approvals", tags=["approvals"])


# ── Models ─────────────────────────────────────────────────────────────────────

class ApprovalCreate(BaseModel):
    invoice_id:        str = Field(...)
    approver_id:       str = Field(...)
    decision:          str = Field(default="pending")
    reason:            str | None = Field(default=None)
    exception_type:    str | None = Field(default=None)
    exception_context: str | None = Field(default=None)   # human-readable "why"
    department:        str | None = Field(default=None)
    invoice_amount:    float | None = Field(default=None)


class ApprovalResponse(BaseModel):
    id:                str
    invoice_id:        str
    approver_id:       str
    decision:          str
    reason:            str | None = None
    exception_type:    str | None = None
    exception_context: str | None = None    # e.g. "Unit price exceeds PO by 8%"
    department:        str | None = None
    invoice_amount:    float | None = None
    requested_at:      str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    decided_at:        str | None = None


class ApprovalDecisionUpdate(BaseModel):
    decision: str = Field(...)
    reason:   str | None = Field(default=None)


# ── Seeded data (rich exception context) ───────────────────────────────────────

approvals_db: dict[str, list[ApprovalResponse]] = {
    "admin@vendorflow.ai": [
        ApprovalResponse(
            id="apr-001",
            invoice_id="inv-001",
            approver_id="engineering-head",
            decision="pending",
            reason=None,
            exception_type="exception_price",
            exception_context="Unit price exceeds PO by 8% — Invoice total $5,400 vs PO expected $5,000. "
                              "Vendor: TechCorp. Requires Engineering head approval before payment.",
            department="Engineering",
            invoice_amount=5400.00,
        ),
        ApprovalResponse(
            id="apr-002",
            invoice_id="inv-002",
            approver_id="operations-head",
            decision="pending",
            reason=None,
            exception_type="exception_grn",
            exception_context="Goods Receipt Note missing — PO-3100 has no confirmed GRN. "
                              "Vendor: LogiTrans Global. Goods may not have been received. "
                              "Operations head must verify physical receipt before approval.",
            department="Operations",
            invoice_amount=12850.00,
        ),
        ApprovalResponse(
            id="apr-003",
            invoice_id="inv-003",
            approver_id="finance-head",
            decision="pending",
            reason=None,
            exception_type="exception_tax",
            exception_context="Tax code mismatch vs PO-9800 — Invoice applies 18% GST but PO specifies 15%. "
                              "Vendor: Apex Industries. Low OCR confidence on line items (0.93). "
                              "Finance head review required.",
            department="Finance",
            invoice_amount=3200.00,
        ),
    ]
}

# ── Exception type → department head routing map ───────────────────────────────
_EXCEPTION_ROUTING: dict[str, str] = {
    "exception_price":  "finance-head",
    "exception_grn":    "operations-head",
    "exception_tax":    "finance-head",
    "exception_fraud":  "cfo",           # fraud always escalates to CFO
    "exception_budget": "cfo",           # budget overruns go to CFO
    "exception_po":     "procurement-head",
    "manual_review":    "accounts-payable-team",
}

_EXCEPTION_CONTEXT_TEMPLATES: dict[str, str] = {
    "exception_price":  "Invoice amount exceeds PO by more than 5% tolerance. Manual price approval required.",
    "exception_grn":    "Goods Receipt Note not confirmed in ERP. Verify physical delivery before approving payment.",
    "exception_tax":    "Tax code or amount does not match PO. Finance review required.",
    "exception_fraud":  "⚠️ CRITICAL: Bank account or routing number mismatch detected. CFO escalation required.",
    "exception_budget": "Invoice exceeds departmental budget beyond auto-approval threshold. CFO sign-off required.",
    "exception_po":     "Purchase Order not found or mismatched. Procurement must verify PO validity.",
    "manual_review":    "OCR confidence below 95% threshold. AP team manual data verification required.",
}


def create_approval_from_pipeline(
    invoice_id: str,
    status: str,
    department: str,
    invoice_amount: float,
    agent_notes: list[str],
    user_email: str,
) -> ApprovalResponse | None:
    """
    Called by the invoice pipeline (Agent 5 logic).
    Creates an approval record only when there's an exception — clean invoices skip this.
    Returns None for clean (approved) invoices.
    """
    if status == "approved":
        return None   # Clean invoice — no approval routing needed

    approver = _EXCEPTION_ROUTING.get(status, "finance-head")
    context  = _EXCEPTION_CONTEXT_TEMPLATES.get(status, f"Exception: {status}")

    # Enrich context with relevant agent notes
    relevant_notes = [n for n in agent_notes if "Agent 2" in n or "Agent 3" in n or "Agent 4" in n]
    if relevant_notes:
        context += " | " + " | ".join(relevant_notes[-2:])

    approval = ApprovalResponse(
        id=f"apr-{invoice_id}",
        invoice_id=invoice_id,
        approver_id=approver,
        decision="pending",
        exception_type=status,
        exception_context=context,
        department=department,
        invoice_amount=invoice_amount,
    )
    user_approvals = approvals_db.setdefault(user_email, [])
    user_approvals.append(approval)
    return approval


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ApprovalResponse])
def list_approvals(current_user: UserProfile = Depends(get_current_user)) -> list[ApprovalResponse]:
    return approvals_db.get(current_user.email, [])


@router.post("", response_model=ApprovalResponse, status_code=201)
def create_approval(
    payload: ApprovalCreate,
    current_user: UserProfile = Depends(get_current_user),
) -> ApprovalResponse:
    user_approvals = approvals_db.setdefault(current_user.email, [])
    approval = ApprovalResponse(
        id=f"apr-{len(user_approvals) + 1:03d}",
        invoice_id=payload.invoice_id,
        approver_id=payload.approver_id,
        decision=payload.decision,
        reason=payload.reason,
        exception_type=payload.exception_type,
        exception_context=payload.exception_context,
        department=payload.department,
        invoice_amount=payload.invoice_amount,
    )
    user_approvals.append(approval)
    return approval


@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(
    approval_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ApprovalResponse:
    for a in approvals_db.get(current_user.email, []):
        if a.id == approval_id:
            return a
    raise HTTPException(status_code=404, detail="Approval not found")


@router.post("/{approval_id}/decision", response_model=ApprovalResponse)
def update_approval_decision(
    approval_id: str,
    payload: ApprovalDecisionUpdate,
    current_user: UserProfile = Depends(get_current_user),
) -> ApprovalResponse:
    for a in approvals_db.get(current_user.email, []):
        if a.id == approval_id:
            a.decision   = payload.decision
            a.reason     = payload.reason
            a.decided_at = datetime.utcnow().isoformat()
            return a
    raise HTTPException(status_code=404, detail="Approval not found")
