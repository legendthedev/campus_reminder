"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, wsUrl } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Plus,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import clsx from "clsx";

interface ChatRoom {
  id: string;
  order_id: string | null;
  room_type: string;
  participants: string[];
  last_message: {
    content: string;
    sender_name: string | null;
    created_at: string;
  } | null;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  message_type: string;
  created_at: string;
}

interface Analysis {
  message_count: number;
  dispute_risk: string;
  sentiment: string;
  predictions: string[];
  flags: string[];
}

export default function ChatPage() {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    api<ChatRoom[]>("/api/chat/rooms", { token })
      .then(setRooms)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!activeRoom || !token) return;

    api<Message[]>(`/api/chat/rooms/${activeRoom}/messages`, { token })
      .then(setMessages)
      .catch(() => {});

    const ws = new WebSocket(wsUrl(`/ws/chat/${activeRoom}`, token));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            content: data.content,
            message_type: data.message_type,
            created_at: data.timestamp,
          },
        ]);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [activeRoom, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        content: newMessage,
        message_type: "text",
      })
    );
    setNewMessage("");
  };

  const loadAnalysis = async () => {
    if (!activeRoom || !token) return;
    try {
      const data = await api<Analysis>(
        `/api/chat/rooms/${activeRoom}/analysis`,
        { token }
      );
      setAnalysis(data);
      setShowAnalysis(true);
    } catch {
      // silently handle
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeRoom && (
              <button
                onClick={() => {
                  setActiveRoom(null);
                  setShowAnalysis(false);
                }}
                className="text-gray-400 hover:text-black"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-lg font-bold">Messages</h1>
          </div>
          {activeRoom && (
            <Button variant="ghost" size="sm" onClick={loadAnalysis}>
              <BarChart3 className="h-4 w-4 mr-1" /> AI Analysis
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
          {/* Room List */}
          <div
            className={clsx(
              "lg:block",
              activeRoom ? "hidden lg:block" : "block"
            )}
          >
            <Card className="h-full overflow-auto">
              <CardHeader>
                <h2 className="font-semibold text-sm">Conversations</h2>
              </CardHeader>
              <CardContent className="p-0">
                {rooms.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No conversations</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Conversations are created when you place or receive orders
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => {
                          setActiveRoom(room.id);
                          setShowAnalysis(false);
                        }}
                        className={clsx(
                          "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                          activeRoom === room.id && "bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {room.order_id
                              ? `Order #${room.order_id.slice(0, 8)}`
                              : `Room ${room.id.slice(0, 8)}`}
                          </p>
                          <Badge variant="default" className="text-[10px]">
                            {room.room_type}
                          </Badge>
                        </div>
                        {room.last_message && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {room.last_message.sender_name}:{" "}
                            {room.last_message.content}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div
            className={clsx(
              "lg:col-span-2",
              activeRoom ? "block" : "hidden lg:block"
            )}
          >
            {!activeRoom ? (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    Select a conversation to start messaging
                  </p>
                </div>
              </Card>
            ) : showAnalysis && analysis ? (
              <Card className="h-full overflow-auto">
                <CardHeader>
                  <h2 className="font-semibold">AI Chat Analysis</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500">Messages</p>
                      <p className="text-xl font-bold">
                        {analysis.message_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500">Dispute Risk</p>
                      <Badge
                        variant={
                          analysis.dispute_risk === "high"
                            ? "danger"
                            : analysis.dispute_risk === "medium"
                            ? "warning"
                            : "success"
                        }
                      >
                        {analysis.dispute_risk}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500">Sentiment</p>
                      <Badge
                        variant={
                          analysis.sentiment === "positive"
                            ? "success"
                            : analysis.sentiment === "negative"
                            ? "danger"
                            : "default"
                        }
                      >
                        {analysis.sentiment}
                      </Badge>
                    </div>
                  </div>
                  {analysis.predictions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Predictions</p>
                      {analysis.predictions.map((p, i) => (
                        <p key={i} className="text-xs text-gray-600 mb-1">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}
                  {analysis.flags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Flags</p>
                      {analysis.flags.map((f, i) => (
                        <p key={i} className="text-xs text-red-600 mb-1">
                          {f}
                        </p>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAnalysis(false)}
                  >
                    Back to Chat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={clsx(
                          "flex",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={clsx(
                            "max-w-[70%] px-4 py-2 rounded-2xl",
                            isMe
                              ? "bg-black text-white rounded-br-md"
                              : "bg-gray-100 text-black rounded-bl-md",
                            msg.message_type === "system" &&
                              "bg-blue-50 text-blue-700 text-center max-w-full text-xs"
                          )}
                        >
                          {!isMe && msg.sender_name && (
                            <p className="text-xs font-medium opacity-70 mb-0.5">
                              {msg.sender_name}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={clsx(
                              "text-[10px] mt-1",
                              isMe ? "text-gray-300" : "text-gray-400"
                            )}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
