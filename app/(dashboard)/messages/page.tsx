"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import type { ConversationFull } from "@/types";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationFull[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function loadConversations() {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .or(`customer_id.eq.${user!.id},provider_id.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });

      if (!data) {
        setLoading(false);
        return;
      }

      // Enrich with other user info and last message
      const enriched = await Promise.all(
        data.map(async (conv) => {
          const otherUserId =
            conv.customer_id === user!.id ? conv.provider_id : conv.customer_id;

          const [userRes, msgRes, unreadRes] = await Promise.all([
            supabase
              .from("users")
              .select("id, full_name, avatar_url")
              .eq("id", otherUserId)
              .single(),
            supabase
              .from("messages")
              .select("content, created_at, sender_id")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single(),
            supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .neq("sender_id", user!.id)
              .eq("is_read", false),
          ]);

          return {
            ...conv,
            other_user: userRes.data || { id: otherUserId, full_name: "Unknown", avatar_url: null },
            last_message: msgRes.data || undefined,
            unread_count: unreadRes.count || 0,
          } as ConversationFull;
        })
      );

      setConversations(enriched);
      setLoading(false);
    }

    loadConversations();
  }, [user, supabase]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted">No conversations yet.</p>
          <Link href="/search" className="text-primary hover:underline text-sm mt-2 inline-block">
            Find a provider to message
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-primary/10">
                {conv.other_user.avatar_url ? (
                  <img src={conv.other_user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-bold">
                    {getInitials(conv.other_user.full_name)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">
                    {conv.other_user.full_name}
                  </p>
                  {conv.last_message && (
                    <span className="text-xs text-muted shrink-0">
                      {new Date(conv.last_message.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-sm text-muted truncate">
                    {conv.last_message.sender_id === user.id ? "You: " : ""}
                    {conv.last_message.content}
                  </p>
                )}
              </div>
              {conv.unread_count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {conv.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
