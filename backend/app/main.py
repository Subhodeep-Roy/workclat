from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.analytics import router as analytics_router
from .routers.approvals import router as approvals_router
from .routers.auth import router as auth_router
from .routers.health import router as health_router
from .routers.invoices import router as invoices_router
from .routers.notifications import router as notifications_router
from .routers.payments import router as payments_router
from .routers.vendors import router as vendors_router

app = FastAPI(title="VendorFlow AI API", version="0.1.0")

# Allow requests from Next.js dev server & Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(invoices_router)
app.include_router(approvals_router)
app.include_router(payments_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(vendors_router)

# /api prefix routers (for Vercel serverless routing)
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(vendors_router, prefix="/api")
