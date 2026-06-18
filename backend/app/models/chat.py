from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    room_type = Column(String, nullable=False)  # direct, order, support
    created_at = Column(DateTime, default=datetime.utcnow)

    participants = relationship("ChatParticipant", back_populates="room")
    messages = relationship("ChatMessage", back_populates="room")


class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id = Column(String, primary_key=True, index=True)
    room_id = Column(String, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ChatRoom", back_populates="participants")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    room_id = Column(String, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # text, image, system, ai_suggestion
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
