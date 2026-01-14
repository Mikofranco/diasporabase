"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, MessageSquare, Send, Reply } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Volunteer } from "@/lib/types";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  profiles: {
    full_name: string;
    role?: string;
  };
  tagged_users?: { tagged_user: string; full_name: string }[];
}

interface CommentsModalProps {
  deliverableId: string;
  volunteers: Volunteer[];
  projectId: string;
}

export function CommentsModal({ deliverableId, volunteers, projectId }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<Volunteer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Volunteer[]>([]);
  const [cursorPos, setCursorPos] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    fetchComments();

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
        (payload: any) => {
          supabase
            .from("deliverable_comments")
            .select(`
              id,
              comment_text,
              created_at,
              user_id,
              parent_comment_id,
              profiles!inner (full_name, role),
              tagged_users
            `)
            .eq("id", payload.new.id)
            .single()
            .then(({ data }: any) => {
              if (data) {
                setComments((prev) => {
                  const exists = prev.some((c) => c.id === data.id);
                  return exists ? prev : [...prev, data];
                });
              }
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
        parent_comment_id,
        profiles!inner (full_name, role),
        tagged_users
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setCursorPos(cursor);
    setNewComment(value);

    const textBeforeCursor = value.substring(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase().trim();
    const alreadyTagged = new Set(taggedUsers.map((v) => v.volunteer_id));
    const available = volunteers.filter((v) => !alreadyTagged.has(v.volunteer_id));

    if (query === "") {
      setSuggestions(available);
      setShowSuggestions(available.length > 0);
    } else {
      const filtered = available.filter((v) =>
        v.full_name.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const tagVolunteer = (volunteer: Volunteer) => {
    if (taggedUsers.some((v) => v.volunteer_id === volunteer.volunteer_id)) {
      setShowSuggestions(false);
      return;
    }

    const textBefore = newComment.substring(0, cursorPos);
    const lastAt = textBefore.lastIndexOf("@");
    const textAfter = newComment.substring(cursorPos);

    const newText =
      textBefore.substring(0, lastAt) + `@${volunteer.full_name} ` + textAfter;

    setNewComment(newText);
    setTaggedUsers((prev) => [...prev, volunteer]);
    setShowSuggestions(false);

    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = lastAt + volunteer.full_name.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const removeTag = (volunteerId: string) => {
    setTaggedUsers((prev) => prev.filter((v) => v.volunteer_id !== volunteerId));
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
        parent_comment_id: replyToId,
        tagged_users: taggedUsers.map((v) => v.volunteer_id),
        project_id: projectId,
      });

    if (error) {
      toast.error("Failed to post comment");
      console.error(error);
    } else {
      setNewComment("");
      setTaggedUsers([]);
      setReplyToId(null);
      toast.success("Comment posted!");
    }

    setLoading(false);
  };

  const startReply = (commentId: string) => {
    setReplyToId(commentId);
    inputRef.current?.focus();
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Group comments into threads
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const repliesMap = new Map<string, Comment[]>();
  comments.forEach((c) => {
    if (c.parent_comment_id) {
      const arr = repliesMap.get(c.parent_comment_id) || [];
      arr.push(c);
      repliesMap.set(c.parent_comment_id, arr);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2 text-diaspora-darkBlue">
            <MessageSquare className="h-5 w-5" />
            Deliverable Comments
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {topLevelComments.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            topLevelComments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                {/* Parent Comment */}
                <div className="flex gap-4 p-4 rounded-2xl bg-muted/40 border">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarFallback>{getInitials(comment.profiles.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium">{comment.profiles.full_name}</span>
                      {comment.profiles.role && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          {comment.profiles.role}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {comment.comment_text}
                    </p>
                      {/*@ts-ignore*/}
                    {comment.tagged_users?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="text-xs text-muted-foreground self-center">Mentioned:</span>{/*@ts-ignore*/}
                        {comment.tagged_users.map((u, i) => (
                          <Badge key={`${u.tagged_user}-${i}`} variant="secondary" className="text-xs">
                            @{u.full_name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 h-8 px-3 text-xs gap-1.5 text-diaspora-blue "
                      onClick={() => startReply(comment.id)}
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Reply
                    </Button>
                  </div>
                </div>

                {/* Replies */}
                {repliesMap.get(comment.id)?.map((reply) => (
                  <div key={reply.id} className="ml-12 flex gap-3 p-4 rounded-xl bg-blue-50 border">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>{getInitials(reply.profiles.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{reply.profiles.full_name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {reply.comment_text}
                      </p>
                      {/*@ts-ignore*/}
                      {reply.tagged_users?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">{/*@ts-ignore*/}
                          {reply.tagged_users.map((u, i) => (
                            <Badge key={`${u.tagged_user}-${i}`} variant="secondary" className="text-xs">
                              @{u.full_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Fixed Input Area at Bottom */}
        <div className="border-t bg-background px-6 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {replyToId && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              <span>Replying to comment</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setReplyToId(null)}
              >
                Cancel
              </Button>
            </div>
          )}

          {taggedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {taggedUsers.map((vol) => (
                <Badge
                  key={vol.volunteer_id}
                  variant="secondary"
                  className="pl-3 pr-1.5 py-1 gap-1 text-sm text-diaspora-blue"
                >
                  @{vol.full_name}
                  <button
                    onClick={() => removeTag(vol.volunteer_id)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="flex gap-3">
              <Textarea
                ref={inputRef}
                placeholder={replyToId ? "Write your reply..." : "Add your comment... type @ to mention teammates"}
                value={newComment}
                onChange={handleInputChange}
                rows={2}
                className="min-h-[48px] flex-1 resize-none text-base"
                disabled={loading}
              />
              <Button
                onClick={handlePostComment}
                disabled={loading || !newComment.trim()}
                className="self-end min-w-[88px] h-[48px] action-btn"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div
                className={cn(
                  "absolute bottom-full left-0 w-full mb-4",
                  "max-h-[340px] overflow-y-auto",
                  "bg-white border border-gray-200 rounded-xl shadow-2xl",
                  "z-[999] divide-y divide-gray-100",
                  "animate-in fade-in-0 zoom-in-95 duration-150"
                )}
              >
                {suggestions.length === 0 ? (
                  <p className="py-8 px-6 text-center text-sm text-muted-foreground">
                    No matching teammates found
                  </p>
                ) : (
                  suggestions.map((vol) => (
                    <button
                      key={vol.volunteer_id}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-accent transition-colors text-left"
                      onClick={() => tagVolunteer(vol)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarFallback className="text-base">
                          {getInitials(vol.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{vol.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{vol.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}