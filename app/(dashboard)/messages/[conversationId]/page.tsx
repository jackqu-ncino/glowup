"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { getInitials, cn } from "@/lib/utils";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();
  const supabase = createClient();
  const { messages, loading, sendMessage, markAsRead } =
    useRealtimeMessages(conversationId);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{
    full_name: string;
    avatar_url: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load other user info
  useEffect(() => {
    if (!user) return;

    async function loadConversation() {
      const { data: conv } = await supabase
        .from("conversations")
        .select("customer_id, provider_id")
        .eq("id", conversationId)
        .single();

      if (conv) {
        const otherUserId =
          conv.customer_id === user!.id ? conv.provider_id : conv.customer_id;
        const { data: otherUserData } = await supabase
          .from("users")
          .select("full_name, avatar_url")
          .eq("id", otherUserId)
          .single();
        setOtherUser(otherUserData);
      }
    }

    loadConversation();
  }, [user, conversationId, supabase]);

  // Mark messages as read
  useEffect(() => {
    if (user && messages.length > 0) {
      markAsRead(user.id);
    }
  }, [messages, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    await sendMessage(newMessage.trim(), user.id);
    setNewMessage("");
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-3">
        {otherUser && (
          <>
            <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10">
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm">
                  {getInitials(otherUser.full_name)}
                </div>
              )}
            </div>
            <h2 className="font-semibold">{otherUser.full_name}</h2>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted text-sm py-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user.id;
            return (
              <div
                key={msg.id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2",
                    isOwn
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isOwn ? "text-white/70" : "text-muted"
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 pt-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
