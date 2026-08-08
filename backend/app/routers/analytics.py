from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def analytics_summary() -> dict[str, object]:
    return {
        # KPI totals
        "totalPendingAP": 1400000,
        "pendingInvoiceCount": 142,
        "exceptionRate": 12,
        "exceptionInvoiceCount": 17,
        "readyForRelease": 450000,
        "readyInvoiceCount": 89,
        # Performance stats
        "avgProcessingDays": 2.4,
        "autoMatchRate": 88.2,
        "totalSpendProcessed": 12800000,
        "totalInvoicesProcessed": 1240,
        "earlyPaymentDiscounts": 34200,
        # Exception breakdown (percent)
        "exceptionBreakdown": {
            "priceVariance": 45,
            "missingGRN": 30,
            "taxMismatch": 15,
            "duplicates": 10,
        },
        # Top vendors by spend
        "topVendors": [
            {"name": "TechCorp Inc.",   "spend": 340000, "invoiceCount": 34},
            {"name": "LogiTrans Global","spend": 215000, "invoiceCount": 18},
            {"name": "CloudScale Inc",  "spend": 180000, "invoiceCount": 12},
            {"name": "Apex Industries", "spend":  95000, "invoiceCount":  8},
        ],
    }
