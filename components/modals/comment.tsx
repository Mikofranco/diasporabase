"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    role?: string;
  };
}

interface CommentsModalProps {
  deliverableId: string;
}

export function CommentsModal({ deliverableId }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    fetchComments();

    // Realtime: Listen for new comments on this deliverable
    const channel = supabase
      .channel(`deliverable-comments:${deliverableId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deliverable_comments",
          filter: `deliverable_id=eq.${deliverableId}`,
        },
        (payload) => {
          // Fetch the full comment with user profile
          supabase
            .from("deliverable_comments")
            .select("*, profiles(full_name, role)")
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) setComments((prev) => [...prev, data]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, deliverableId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("deliverable_comments")
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        profiles!inner (full_name, role)
      `)
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch comments error:", error);
      toast.error("Failed to load comments");
      return;
    }

    setComments(data || []);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return toast.error("Comment cannot be empty");

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in to comment");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("deliverable_comments")
      .insert({
        deliverable_id: deliverableId,
        user_id: user.id,
        comment_text: newComment.trim(),
      });

    if (error) {
      toast.error("Failed to post comment");
      console.error(error);
    } else {
      setNewComment("");
      toast.success("Comment posted!");
    }

    setLoading(false);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Deliverable Comments
          </DialogTitle>
        </DialogHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(comment.profiles.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.profiles.full_name}</span>
                    {comment.profiles.role && (
                      <span className="text-xs text-muted-foreground">
                        ({comment.profiles.role})
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="pt-4 border-t flex gap-2">
          <Textarea
            placeholder="Add your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="min-h-[44px] flex-1"
            disabled={loading}
          />
          <Button
            onClick={handlePostComment}
            disabled={loading || !newComment.trim()}
            className="self-end"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}