from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from .auth import get_current_user, UserProfile

router = APIRouter(prefix="/vendors", tags=["vendors"])


class VendorCreate(BaseModel):
    name: str = Field(...)
    category: str = Field(...)
    payment_terms: str = Field(default="Net 30")
    tax_id: str | None = Field(default=None)
    email: str | None = Field(default=None)


class VendorResponse(BaseModel):
    id: str
    name: str
    category: str
    payment_terms: str
    compliance_status: str
    tax_id: str | None = None
    email: str | None = None


# Seeded vendor master data
vendors_db: list[VendorResponse] = [
    VendorResponse(
        id="vnd-001",
        name="TechCorp Inc.",
        category="Software & Cloud",
        payment_terms="Net 30",
        compliance_status="Verified W-9",
        tax_id="12-3456789",
        email="ap@techcorp.com",
    ),
    VendorResponse(
        id="vnd-002",
        name="LogiTrans Global",
        category="Freight & Logistics",
        payment_terms="Net 15",
        compliance_status="Verified W-9",
        tax_id="98-7654321",
        email="billing@logitrans.com",
    ),
    VendorResponse(
        id="vnd-003",
        name="CloudScale Inc",
        category="Infrastructure",
        payment_terms="Net 45",
        compliance_status="W-9 Expiring Soon",
        tax_id="55-1234567",
        email="finance@cloudscale.io",
    ),
    VendorResponse(
        id="vnd-004",
        name="Apex Industries",
        category="Hardware Parts",
        payment_terms="Net 30",
        compliance_status="Verified W-9",
        tax_id="33-9876543",
        email="accounts@apexind.com",
    ),
]


@router.get("", response_model=list[VendorResponse])
def list_vendors(current_user: UserProfile = Depends(get_current_user)) -> list[VendorResponse]:
    return vendors_db


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: str, current_user: UserProfile = Depends(get_current_user)) -> VendorResponse:
    for vendor in vendors_db:
        if vendor.id == vendor_id:
            return vendor
    raise HTTPException(status_code=404, detail="Vendor not found")


@router.post("", response_model=VendorResponse, status_code=201)
def create_vendor(
    payload: VendorCreate, current_user: UserProfile = Depends(get_current_user)
) -> VendorResponse:
    vendor = VendorResponse(
        id=f"vnd-{len(vendors_db) + 1:03d}",
        name=payload.name,
        category=payload.category,
        payment_terms=payload.payment_terms,
        compliance_status="Pending Review",
        tax_id=payload.tax_id,
        email=payload.email,
    )
    vendors_db.append(vendor)
    return vendor
