"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { X } from "lucide-react"; // For remove icon

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user: { full_name: string; role: string };
  tagged_users: { full_name: string }[];
}

interface CommentsProps {
  projectId: string;
  volunteers: Volunteer[]; // List of project team members
}

export default function Comments({ projectId, volunteers }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Volunteer[]>([]);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  const fetchComments = async () => {
    const res = await fetch(`/api/projects/${projectId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
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

    const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase().trim();

    const available = volunteers.filter((v) => !taggedUserIds.includes(v.volunteer_id));

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
    const textBefore = newComment.substring(0, cursorPos);
    const lastAt = textBefore.lastIndexOf("@");
    const textAfter = newComment.substring(cursorPos);

    const newText =
      textBefore.substring(0, lastAt) +
      `@${volunteer.full_name} ` +
      textAfter;

    setNewComment(newText);
    setTaggedUserIds((prev) => [...prev, volunteer.volunteer_id]);
    setShowSuggestions(false);

    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = lastAt + volunteer.full_name.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const removeTag = (volunteerId: string) => {
    setTaggedUserIds((prev) => prev.filter((id) => id !== volunteerId));
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const res = await fetch(`/api/projects/${projectId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment_text: newComment,
        tagged_users: taggedUserIds,
      }),
    });

    if (res.ok) {
      toast.success("Comment posted!");
      setNewComment("");
      setTaggedUserIds([]);
      setShowSuggestions(false);
      fetchComments();
    } else {
      toast.error("Failed to post comment");
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Project Comments</h3>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {getInitials(comment.user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{comment.user.full_name}</p>
                    <span className="text-xs text-muted-foreground">
                      ({comment.user.role})
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{comment.comment_text}</p>
                  {comment.tagged_users.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Mentioned:</span>
                      {comment.tagged_users.map((u) => (
                        <Badge key={u.full_name} variant="secondary" className="text-xs">
                          {u.full_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Input + Tagging */}
      <div className="space-y-3">
        {/* Tagged Users Preview with Remove Button */}
        {taggedUserIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {taggedUserIds.map((id) => {
              const vol = volunteers.find((v) => v.volunteer_id === id);
              if (!vol) return null;
              return (
                <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1">
                  <span>{vol.full_name}</span>
                  <button
                    onClick={() => removeTag(id)}
                    className="ml-1.5 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Input with Dropdown */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Write a comment... type @ to mention teammates"
                value={newComment}
                onChange={handleInputChange}
                className="pr-10"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <Card className="absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto shadow-xl z-20 border">
                  <div className="p-1">
                    {suggestions.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No teammates found
                      </p>
                    ) : (
                      suggestions.map((volunteer) => (
                        <button
                          key={volunteer.volunteer_id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => tagVolunteer(volunteer)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left"
                          )}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(volunteer.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{volunteer.full_name}</p>
                            <p className="text-xs text-muted-foreground">{volunteer.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </Card>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={!newComment.trim()}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}