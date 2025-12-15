"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, MessageCircle, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
}

interface Rating {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
}

export default function PublicProjectView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .or("status.eq.active,status.eq.completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data || []);
      console.log;
    }
    setLoading(false);
  };

  const fetchRatings = async (projectId: string) => {
    const { data, error } = await supabase
      .from("project_ratings")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ratings:", error);
    } else {
      setRatings(data || []);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    fetchRatings(project.id);
  };

  const handleSubmitRating = async () => {
    if (!selectedProject || !userName.trim() || newRating === 0) {
      alert("Please fill in all fields and select a rating");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("project_ratings").insert(
      {
        project_id: selectedProject.id,
        rating: newRating,
        comment: newComment.trim(),
        user_name: userName.trim(),
        email: userEmail.trim(),
      },
      {
        onConflict: "project_id,email", // Key: replace if this combo exists
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error("Error submitting rating:", error);
      toast.error("Error submitting rating. Please try again.");
    } else {
      setNewRating(0);
      setNewComment("");
      setUserName("");
      fetchRatings(selectedProject.id);
    }

    setSubmitting(false);
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onStarClick?: (rating: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = (ratings: Rating[]) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2"> Projects</h1>
        <p className="text-muted-foreground">
          Discover volunteer opportunities and share your experience with the
          community.
        </p>
      </div>

      {!selectedProject ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription>{project.organization_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {project.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(project.start_date).toLocaleDateString()} -{" "}
                      {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {project.volunteers_registered}/
                      {project.volunteers_needed} volunteers
                    </span>
                  </div>
                  <Badge variant="secondary">{project.category}</Badge>
                </div>
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
                  onClick={() => handleProjectSelect(project)}
                >
                  View Details & Rate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            className="mb-6 bg-transparent"
            onClick={() => setSelectedProject(null)}
          >
            ← Back to Projects
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Project Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {selectedProject.title}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {selectedProject.organization_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{selectedProject.description}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Project Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(
                              selectedProject.start_date
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              selectedProject.end_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {selectedProject.volunteers_registered}/
                            {selectedProject.volunteers_needed} volunteers
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {selectedProject.category}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Community Rating</h4>
                      <div className="flex items-center gap-2">
                        {renderStars(getAverageRating(ratings))}
                        <span className="text-sm text-muted-foreground">
                          ({getAverageRating(ratings)}/5 from {ratings.length}{" "}
                          reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Community Reviews ({ratings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div
                        key={rating.id}
                        className="border-b pb-4 last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {rating.user_name}
                            </span>
                            {renderStars(rating.rating)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                    {ratings.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No reviews yet. Be the first to share your experience!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rating Form */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Share Your Experience</CardTitle>
                  <CardDescription>
                    Rate this project and leave a comment for the community.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="user-name">Your Name</Label>
                    <Input
                      id="user-name"
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="user-email">Your Email</Label>
                    <Input
                      id="user-email"
                      placeholder="Enter your email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Rating</Label>
                    <div className="mt-2">
                      {renderStars(newRating, true, setNewRating)}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="comment">Comment (Optional)</Label>
                    <Textarea
                      id="comment"
                      placeholder="Share your thoughts about this project..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
                    onClick={handleSubmitRating}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
