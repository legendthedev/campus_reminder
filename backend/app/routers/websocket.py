import json
from datetime import datetime

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.chat import ChatMessage, ChatParticipant
from app.models.user import User
from app.services.auth import decode_token, generate_id

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active:
            self.active[room_id] = []
        self.active[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active:
            self.active[room_id] = [
                ws for ws in self.active[room_id] if ws != websocket
            ]
            if not self.active[room_id]:
                del self.active[room_id]

    async def broadcast(self, room_id: str, message: dict, exclude: WebSocket | None = None):
        if room_id in self.active:
            for ws in self.active[room_id]:
                if ws != exclude:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass


manager = ConnectionManager()


@router.websocket("/ws/chat/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
    except Exception:
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    try:
        participant = (
            db.query(ChatParticipant)
            .filter(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == user_id,
            )
            .first()
        )
        if not participant:
            await websocket.close(code=4003)
            return

        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.full_name if user else "Unknown"
    finally:
        db.close()

    await manager.connect(room_id, websocket)

    await manager.broadcast(
        room_id,
        {
            "type": "system",
            "content": f"{user_name} joined the chat",
            "timestamp": datetime.utcnow().isoformat(),
        },
        exclude=websocket,
    )

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type", "message")

            if msg_type == "message":
                db = SessionLocal()
                try:
                    message = ChatMessage(
                        id=generate_id(),
                        room_id=room_id,
                        sender_id=user_id,
                        content=data.get("content", ""),
                        message_type=data.get("message_type", "text"),
                    )
                    db.add(message)
                    db.commit()

                    await manager.broadcast(
                        room_id,
                        {
                            "type": "message",
                            "id": message.id,
                            "sender_id": user_id,
                            "sender_name": user_name,
                            "content": message.content,
                            "message_type": message.message_type,
                            "timestamp": message.created_at.isoformat(),
                        },
                    )
                finally:
                    db.close()

            elif msg_type == "typing":
                await manager.broadcast(
                    room_id,
                    {
                        "type": "typing",
                        "sender_id": user_id,
                        "sender_name": user_name,
                    },
                    exclude=websocket,
                )

            elif msg_type == "read_receipt":
                await manager.broadcast(
                    room_id,
                    {
                        "type": "read_receipt",
                        "sender_id": user_id,
                        "message_id": data.get("message_id"),
                    },
                    exclude=websocket,
                )

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await manager.broadcast(
            room_id,
            {
                "type": "system",
                "content": f"{user_name} left the chat",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
    except Exception:
        manager.disconnect(room_id, websocket)
