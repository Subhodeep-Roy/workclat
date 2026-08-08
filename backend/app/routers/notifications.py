from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str = "info"
    is_read: bool = False


notifications_db: list[NotificationResponse] = [
    NotificationResponse(id="ntf-001", title="Invoice processed", message="Your invoice is now in review", type="info")
]


@router.get("", response_model=list[NotificationResponse])
def list_notifications() -> list[NotificationResponse]:
    return notifications_db
