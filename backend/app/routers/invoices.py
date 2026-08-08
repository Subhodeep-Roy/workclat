from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from .auth import get_current_user, UserProfile

router = APIRouter(prefix="/invoices", tags=["invoices"])


class InvoiceCreate(BaseModel):
    invoice_number: str = Field(...)
    vendor_name: str = Field(...)
    total_amount: float = Field(...)
    status: str = Field(default="uploaded")


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    vendor_name: str
    total_amount: float
    status: str


# Seeded exception-queue invoices visible to the default admin account
_seeded: list[InvoiceResponse] = [
    InvoiceResponse(id="inv-001", invoice_number="INV-882",  vendor_name="TechCorp",        total_amount=5400.00,  status="exception_price"),
    InvoiceResponse(id="inv-002", invoice_number="INV-3920", vendor_name="LogiTrans Global", total_amount=12850.00, status="exception_grn"),
    InvoiceResponse(id="inv-003", invoice_number="INV-9912", vendor_name="Apex Industries",  total_amount=3200.00,  status="exception_tax"),
    InvoiceResponse(id="inv-004", invoice_number="INV-1029", vendor_name="Acme Supplies",    total_amount=1450.00,  status="approved"),
    InvoiceResponse(id="inv-005", invoice_number="INV-8831", vendor_name="CloudScale Inc",   total_amount=8900.00,  status="approved"),
    InvoiceResponse(id="inv-006", invoice_number="INV-4011", vendor_name="OmniTech Solutions",total_amount=2100.00,  status="approved"),
]

invoices_db: dict[str, list[InvoiceResponse]] = {
    "admin@vendorflow.ai": list(_seeded),
}


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(current_user: UserProfile = Depends(get_current_user)) -> list[InvoiceResponse]:
    return invoices_db.get(current_user.email, [])


@router.post("", response_model=InvoiceResponse, status_code=201)
def create_invoice(payload: InvoiceCreate, current_user: UserProfile = Depends(get_current_user)) -> InvoiceResponse:
    user_invoices = invoices_db.setdefault(current_user.email, [])
    invoice = InvoiceResponse(
        id=f"inv-{len(user_invoices) + 1:03d}",
        invoice_number=payload.invoice_number,
        vendor_name=payload.vendor_name,
        total_amount=payload.total_amount,
        status=payload.status,
    )
    user_invoices.append(invoice)
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, current_user: UserProfile = Depends(get_current_user)) -> InvoiceResponse:
    user_invoices = invoices_db.get(current_user.email, [])
    for invoice in user_invoices:
        if invoice.id == invoice_id:
            return invoice
    raise HTTPException(status_code=404, detail="Invoice not found")
