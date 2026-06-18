from datetime import datetime

from pydantic import BaseModel


class ChatRoomCreate(BaseModel):
    participant_ids: list[str]
    order_id: str | None = None
    room_type: str = "direct"


class ChatMessageCreate(BaseModel):
    content: str
    message_type: str = "text"


class ChatMessageResponse(BaseModel):
    id: str
    room_id: str
    sender_id: str
    sender_name: str | None = None
    content: str
    message_type: str
    is_read: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRoomResponse(BaseModel):
    id: str
    order_id: str | None = None
    room_type: str
    participants: list[str]
    last_message: ChatMessageResponse | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class WebSocketMessage(BaseModel):
    type: str  # message, typing, read_receipt
    room_id: str
    content: str | None = None
    message_type: str = "text"
