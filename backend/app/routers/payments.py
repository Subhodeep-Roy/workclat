from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/payments", tags=["payments"])


class PaymentCreate(BaseModel):
    invoice_id: str = Field(...)
    amount: float = Field(...)
    due_date: str = Field(...)


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    amount: float
    due_date: str
    status: str = "scheduled"


payments_db: list[PaymentResponse] = []


@router.get("", response_model=list[PaymentResponse])
def list_payments() -> list[PaymentResponse]:
    return payments_db


@router.post("", response_model=PaymentResponse, status_code=201)
def create_payment(payload: PaymentCreate) -> PaymentResponse:
    payment = PaymentResponse(
        id=f"pay-{len(payments_db) + 1:03d}",
        invoice_id=payload.invoice_id,
        amount=payload.amount,
        due_date=payload.due_date,
    )
    payments_db.append(payment)
    return payment
