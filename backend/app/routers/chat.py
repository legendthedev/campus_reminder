from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import ChatMessage, ChatParticipant, ChatRoom
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatRoomCreate,
    ChatRoomResponse,
)
from app.services.auth import generate_id, get_current_user
from app.ai_engine.chat_analyzer import analyze_chat_transcript

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/rooms", response_model=ChatRoomResponse, status_code=201)
def create_room(
    data: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = ChatRoom(
        id=generate_id(),
        order_id=data.order_id,
        room_type=data.room_type,
    )
    db.add(room)

    all_ids = set(data.participant_ids)
    all_ids.add(current_user.id)
    for uid in all_ids:
        participant = ChatParticipant(
            id=generate_id(),
            room_id=room.id,
            user_id=uid,
        )
        db.add(participant)

    db.commit()
    db.refresh(room)

    return ChatRoomResponse(
        id=room.id,
        order_id=room.order_id,
        room_type=room.room_type,
        participants=[p.user_id for p in room.participants],
        last_message=None,
        created_at=room.created_at,
    )


@router.get("/rooms", response_model=list[ChatRoomResponse])
def list_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant_rooms = (
        db.query(ChatParticipant.room_id)
        .filter(ChatParticipant.user_id == current_user.id)
        .subquery()
    )
    rooms = (
        db.query(ChatRoom)
        .filter(ChatRoom.id.in_(db.query(participant_rooms.c.room_id)))
        .all()
    )

    results = []
    for room in rooms:
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.room_id == room.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        last_msg_resp = None
        if last_msg:
            sender = db.query(User).filter(User.id == last_msg.sender_id).first()
            last_msg_resp = ChatMessageResponse(
                id=last_msg.id,
                room_id=last_msg.room_id,
                sender_id=last_msg.sender_id,
                sender_name=sender.full_name if sender else None,
                content=last_msg.content,
                message_type=last_msg.message_type,
                is_read=last_msg.is_read,
                created_at=last_msg.created_at,
            )

        results.append(
            ChatRoomResponse(
                id=room.id,
                order_id=room.order_id,
                room_type=room.room_type,
                participants=[p.user_id for p in room.participants],
                last_message=last_msg_resp,
                created_at=room.created_at,
            )
        )
    return results


@router.post("/rooms/{room_id}/messages", response_model=ChatMessageResponse, status_code=201)
def send_message(
    room_id: str,
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant = (
        db.query(ChatParticipant)
        .filter(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id,
        )
        .first()
    )
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant of this room")

    message = ChatMessage(
        id=generate_id(),
        room_id=room_id,
        sender_id=current_user.id,
        content=data.content,
        message_type=data.message_type,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return ChatMessageResponse(
        id=message.id,
        room_id=message.room_id,
        sender_id=message.sender_id,
        sender_name=current_user.full_name,
        content=message.content,
        message_type=message.message_type,
        is_read=message.is_read,
        created_at=message.created_at,
    )


@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageResponse])
def get_messages(
    room_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant = (
        db.query(ChatParticipant)
        .filter(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id,
        )
        .first()
    )
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant of this room")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        results.append(
            ChatMessageResponse(
                id=msg.id,
                room_id=msg.room_id,
                sender_id=msg.sender_id,
                sender_name=sender.full_name if sender else None,
                content=msg.content,
                message_type=msg.message_type,
                is_read=msg.is_read,
                created_at=msg.created_at,
            )
        )
    return results


@router.get("/rooms/{room_id}/analysis")
def analyze_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant = (
        db.query(ChatParticipant)
        .filter(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id,
        )
        .first()
    )
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant of this room")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    msg_dicts = [{"content": m.content, "sender_id": m.sender_id} for m in messages]
    return analyze_chat_transcript(msg_dicts)
