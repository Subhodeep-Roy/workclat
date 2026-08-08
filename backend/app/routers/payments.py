"""
Agent 6 — Payment Agent
Batch Payment Preparation (Human-in-the-Loop):

Security Fix:
  - The AI NEVER executes a live wire transfer autonomously.
  - It aggregates all fully-validated & approved invoices into a "Ready for Payment" batch.
  - A human Controller / CFO must log in, review the batch, and explicitly release it.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from .auth import get_current_user, UserProfile
from .invoices import invoices_db

router = APIRouter(prefix="/payments", tags=["payments"])


# ── Pydantic models ────────────────────────────────────────────────────────────

class BatchInvoiceItem(BaseModel):
    invoice_id:   str
    invoice_number: str
    vendor_name:  str
    total_amount: float
    department:   str
    bank_account: str | None = None   # masked, e.g. "****4821"
    routing:      str | None = None


class PaymentBatch(BaseModel):
    id:              str
    created_at:      str
    status:          str          # "ready_for_release" | "released" | "cancelled"
    invoice_count:   int
    total_amount:    float
    items:           list[BatchInvoiceItem]
    released_by:     str | None = None
    released_at:     str | None = None
    notes:           list[str] = Field(default_factory=list)


class ReleaseRequest(BaseModel):
    confirmed: bool = Field(..., description="Controller must explicitly set true to release")
    controller_note: str | None = Field(default=None)


# ── In-memory batch store ─────────────────────────────────────────────────────
batches_db: dict[str, list[PaymentBatch]] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_batch(user_email: str) -> PaymentBatch:
    """Collect all 'approved' invoices for this user and pack into a batch."""
    user_invoices = invoices_db.get(user_email, [])
    approved = [inv for inv in user_invoices if inv.status == "approved"]

    items = [
        BatchInvoiceItem(
            invoice_id=inv.id,
            invoice_number=inv.invoice_number,
            vendor_name=inv.vendor_name,
            total_amount=inv.total_amount,
            department=inv.department,
            bank_account=inv.vendor_bank_account,
            routing=inv.vendor_routing,
        )
        for inv in approved
    ]

    total = sum(i.total_amount for i in items)
    batch = PaymentBatch(
        id=f"batch-{str(uuid.uuid4())[:8]}",
        created_at=datetime.utcnow().isoformat(),
        status="ready_for_release",
        invoice_count=len(items),
        total_amount=total,
        items=items,
        notes=[
            "Agent 6: Batch compiled from all fully-validated & approved invoices.",
            f"Agent 6: {len(items)} invoice(s) totalling ${total:,.2f} ready for Controller review.",
            "Agent 6: ⛔  No funds will move until a human Controller explicitly releases this batch.",
        ],
    )
    return batch


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[PaymentBatch])
def list_batches(current_user: UserProfile = Depends(get_current_user)) -> list[PaymentBatch]:
    """Return all payment batches for the current user."""
    return batches_db.get(current_user.email, [])


@router.post("/prepare", response_model=PaymentBatch, status_code=201)
def prepare_batch(current_user: UserProfile = Depends(get_current_user)) -> PaymentBatch:
    """
    Agent 6 action: collect all approved invoices and package into a payment batch.
    Does NOT initiate any transfer.  Human release required.
    """
    batch = _build_batch(current_user.email)
    user_batches = batches_db.setdefault(current_user.email, [])
    user_batches.append(batch)
    return batch


@router.post("/{batch_id}/release", response_model=PaymentBatch)
def release_batch(
    batch_id: str,
    body: ReleaseRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> PaymentBatch:
    """
    Human Controller step: explicitly release a batch to Treasury.

    Security gate: `confirmed` must be True — prevents accidental releases.
    """
    if not body.confirmed:
        raise HTTPException(
            status_code=400,
            detail="Release requires explicit confirmation (confirmed=true). "
                   "The Controller must review the batch before releasing."
        )

    user_batches = batches_db.get(current_user.email, [])
    for batch in user_batches:
        if batch.id == batch_id:
            if batch.status == "released":
                raise HTTPException(status_code=409, detail="Batch already released.")
            if batch.status == "cancelled":
                raise HTTPException(status_code=409, detail="Cannot release a cancelled batch.")

            batch.status       = "released"
            batch.released_by  = current_user.email
            batch.released_at  = datetime.utcnow().isoformat()
            if body.controller_note:
                batch.notes.append(f"Controller note: {body.controller_note}")
            batch.notes.append(
                f"Agent 6: Batch released to Treasury by {current_user.name} "
                f"at {batch.released_at}. Funds authorised: ${batch.total_amount:,.2f}."
            )

            # Mark all included invoices as released
            user_invoices = invoices_db.get(current_user.email, [])
            released_ids = {item.invoice_id for item in batch.items}
            for inv in user_invoices:
                if inv.id in released_ids:
                    inv.status = "released"
                    inv.agent_notes.append(f"Agent 6: Released in batch {batch_id}")

            return batch

    raise HTTPException(status_code=404, detail="Batch not found.")


@router.delete("/{batch_id}", response_model=PaymentBatch)
def cancel_batch(
    batch_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> PaymentBatch:
    """Cancel a pending batch (before release)."""
    user_batches = batches_db.get(current_user.email, [])
    for batch in user_batches:
        if batch.id == batch_id:
            if batch.status == "released":
                raise HTTPException(status_code=409, detail="Cannot cancel an already-released batch.")
            batch.status = "cancelled"
            batch.notes.append(f"Agent 6: Batch cancelled by {current_user.name}.")
            return batch
    raise HTTPException(status_code=404, detail="Batch not found.")
