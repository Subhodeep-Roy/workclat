from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from .auth import get_current_user, UserProfile

router = APIRouter(prefix="/approvals", tags=["approvals"])


class ApprovalCreate(BaseModel):
    invoice_id: str = Field(...)
    approver_id: str = Field(...)
    decision: str = Field(default="approved")
    reason: str | None = Field(default=None)


class ApprovalResponse(BaseModel):
    id: str
    invoice_id: str
    approver_id: str
    decision: str
    reason: str | None = None


class ApprovalDecisionUpdate(BaseModel):
    decision: str = Field(...)
    reason: str | None = Field(default=None)


approvals_db: dict[str, list[ApprovalResponse]] = {
    "admin@vendorflow.ai": [
        ApprovalResponse(id="apr-001", invoice_id="inv-001", approver_id="finance-ops", decision="pending", reason=None),
        ApprovalResponse(id="apr-002", invoice_id="inv-002", approver_id="finance-ops", decision="pending", reason=None),
    ]
}


@router.get("", response_model=list[ApprovalResponse])
def list_approvals(current_user: UserProfile = Depends(get_current_user)) -> list[ApprovalResponse]:
    return approvals_db.get(current_user.email, [])


@router.post("", response_model=ApprovalResponse, status_code=201)
def create_approval(payload: ApprovalCreate, current_user: UserProfile = Depends(get_current_user)) -> ApprovalResponse:
    user_approvals = approvals_db.setdefault(current_user.email, [])
    approval = ApprovalResponse(
        id=f"apr-{len(user_approvals) + 1:03d}",
        invoice_id=payload.invoice_id,
        approver_id=payload.approver_id,
        decision=payload.decision,
        reason=payload.reason,
    )
    user_approvals.append(approval)
    return approval


@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(approval_id: str, current_user: UserProfile = Depends(get_current_user)) -> ApprovalResponse:
    user_approvals = approvals_db.get(current_user.email, [])
    for approval in user_approvals:
        if approval.id == approval_id:
            return approval
    raise HTTPException(status_code=404, detail="Approval not found")


@router.post("/{approval_id}/decision", response_model=ApprovalResponse)
def update_approval_decision(approval_id: str, payload: ApprovalDecisionUpdate, current_user: UserProfile = Depends(get_current_user)) -> ApprovalResponse:
    user_approvals = approvals_db.get(current_user.email, [])
    for approval in user_approvals:
        if approval.id == approval_id:
            approval.decision = payload.decision
            approval.reason = payload.reason
            return approval
    raise HTTPException(status_code=404, detail="Approval not found")
