"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import { createNotification } from "@/services/notification";
import { useSendMail } from "@/services/mail";
import { taggedInCommentHTML } from "@/lib/email-templates/notification";
import { Volunteer } from "@/lib/types";
import { se } from "date-fns/locale";
import { set } from "nprogress";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  author: { full_name: string; role: string };
  tagged_users: { tagged_user: string; full_name: string }[];
}

interface CommentsProps {
  projectId: string;
  volunteers: Volunteer[]; // project team members who can be tagged
  projectTitle?: string;
}

export default function Comments({
  projectId,
  volunteers,
  projectTitle,
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [taggedUsers, setTaggedUsers] = useState<Volunteer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Volunteer[]>([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  const fetchComments = async () => {
    const { data, error } = await supabase.rpc(
      "get_project_comments_enriched",
      {
        p_project_id: projectId,
      }
    );

    if (error) {
      console.error("Fetch comments error:", error);
      toast.error("Failed to load comments");
      return;
    }

    // RPC returns: id, comment_text, created_at, author (jsonb), tagged_users (jsonb array)
    const formatted =
      data?.map((c: any) => ({
        id: c.id,
        comment_text: c.comment_text,
        created_at: c.created_at,
        author: c.author || { full_name: "Unknown", role: "" },
        tagged_users:
          c.tagged_users?.map((t: any) => ({
            tagged_user: t.tagged_user,
            full_name: t.full_name || "Unknown",
          })) || [],
      })) || [];

    setComments(formatted);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const query = textBeforeCursor
      .substring(lastAtIndex + 1)
      .toLowerCase()
      .trim();
    const alreadyTagged = new Set(taggedUsers.map((v) => v.volunteer_id));
    const available = volunteers.filter(
      (v) => !alreadyTagged.has(v.volunteer_id)
    );

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
    // Prevent duplicates
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

    // Restore focus and cursor position
    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = lastAt + volunteer.full_name.length + 2; // +2 for "@" and space
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const removeTag = (volunteerId: string) => {
    setTaggedUsers((prev) =>
      prev.filter((v) => v.volunteer_id !== volunteerId)
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }

    const commentText = newComment.trim();

    // 1. Insert the comment
    const { data: commentData, error: commentError } = await supabase
      .from("project_comments")
      .insert({
        project_id: projectId,
        user_id: user.id,
        comment_text: commentText,
      })
      .select("id")
      .single();

    if (commentError || !commentData) {
      console.error("Comment error:", commentError);
      toast.error("Failed to post comment");
      return;
    }

    // 2. Insert tags (if any)
    if (taggedUsers.length > 0) {
      const tagsToInsert = taggedUsers.map((vol) => ({
        comment_id: commentData.id,
        volunteer_id: vol.volunteer_id,
      }));

      const { error: tagsError } = await supabase
        .from("project_comment_tags")
        .insert(tagsToInsert);

      if (tagsError) {
        console.error("Tags error:", tagsError);
        // Optional: still show success for comment but warn
        // toast.warning("Comment posted but tags failed to save");
      }
      // 3. Create notifications for tagged users
      for (const vol of taggedUsers) {
        try {
          await createNotification({//@ts-ignore
            userId: vol.id,
            message: `You were mentioned in a comment on project ${projectId}`,
            type: "tagged_in_comment",
            relatedId: commentData.id,
            projectId: projectId,
          });
        } catch (notifError) {
          console.error("Notification error for", vol.volunteer_id, notifError);
        }
      }

      //send email notifications to tagged users
      await useSendMail({//@ts-ignore
        to: taggedUsers.map((vol) => vol.email),
        subject: `You were mentioned in a comment`,
        html: taggedInCommentHTML(
          taggedUsers.map((vol) => vol.full_name).join(", "),
          user.user_metadata.full_name || "A teammate",
          commentText,
          projectTitle || "a project",
          projectId
        ),
      });
    }

    toast.success("Comment posted!");
    setSubmitting(false);
    setNewComment("");
    setTaggedUsers([]);
    setShowSuggestions(false);
    fetchComments();
  };

  return (
    <Card className="space-y-6">
      <CardTitle className="p-4  text-diaspora-darkBlue">Project Comments</CardTitle>
      <CardContent>
        {/* Comments List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No comments yet. Be the first to start the conversation!
            </p>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {getInitials(comment.author.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{comment.author.full_name}</p>
                      <span className="text-xs text-muted-foreground">
                        ({comment.author.role})
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">
                      {comment.comment_text}
                    </p>

                    {comment.tagged_users?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">
                          Mentioned:
                        </span>
                        {comment.tagged_users.map((u, index) => (
                          <Badge
                            key={`${u.tagged_user}-${index}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            @{u.full_name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-3 pt-4 border-t">
          {/* Current tags preview */}
          {taggedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {taggedUsers.map((vol) => (
                <Badge
                  key={vol.volunteer_id}
                  variant="secondary"
                  className="pl-3 pr-1 py-1 gap-1"
                >
                  @{vol.full_name}
                  <button
                    onClick={() => removeTag(vol.volunteer_id)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Comment input + submit */}
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Write a comment... type @ to mention teammates"
                value={newComment}
                onChange={handleInputChange}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />

              {/* Mention suggestions */}
              {showSuggestions && (
                <Card className="absolute bottom-full left-0 w-full mb-2 max-h-72 overflow-y-auto shadow-2xl z-50 border">
                  <div className="p-1.5">
                    {suggestions.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No matching teammates found
                      </p>
                    ) : (
                      suggestions.map((volunteer) => (
                        <button
                          key={volunteer.volunteer_id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => tagVolunteer(volunteer)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-accent transition-colors text-left"
                          )}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-sm">
                              {getInitials(volunteer.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{volunteer.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {volunteer.email}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </Card>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="self-end  bg-diaspora-darkBlue hover:bg-diaspora-darkBlue/90"
            >
              { submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
