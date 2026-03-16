"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/navbar";
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
import { routes } from "@/lib/routes";
import { getStatusBadgeClasses } from "@/lib/utils";

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
  completed_project_link: string | null;
  closing_remarks?: string | null;
}

interface Rating {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
}

export default function PublicProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;

  const [project, setProject] = useState<Project | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!projectId) return;
    fetchProjectAndRatings(projectId as string);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProjectAndRatings = async (id: string) => {
    setLoading(true);

    const [
      { data: projectData, error: projectError },
      { data: ratingsData, error: ratingsError },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("project_ratings")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (projectError) {
      console.error("Error fetching project:", projectError);
      toast.error("Unable to load project details.");
    } else {
      setProject(projectData ?? null);
    }

    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
    } else {
      setRatings(ratingsData || []);
    }

    setLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!project || !userName.trim() || newRating === 0) {
      toast.error("Please fill in all fields and select a rating");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("project_ratings").insert(
      {
        project_id: project.id,
        rating: newRating,
        comment: newComment.trim(),
        user_name: userName.trim(),
        email: userEmail.trim(),
      },
      {
        onConflict: "project_id,email",
        ignoreDuplicates: false,
      },
    );

    if (error) {
      console.error("Error submitting rating:", error);
      toast.error("Error submitting rating. Please try again.");
    } else {
      setNewRating(0);
      setNewComment("");
      setUserName("");
      fetchProjectAndRatings(project.id);
    }

    setSubmitting(false);
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onStarClick?: (rating: number) => void,
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
      <div className="flex flex-col min-h-[100dvh]">
        <NavBar />
        <main className="flex-1 pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-4/6" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <NavBar />
        <main className="flex-1 pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <p className="text-muted-foreground">Project not found.</p>
            <Link href={routes.generalProjectsView}>
              <Button variant="outline" className="mt-4">
                ← Back to Projects
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <NavBar />
      <main className="flex-1 pt-24 pb-12">
        <section>
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <nav className="mb-6 text-sm text-muted-foreground">
              <ol className="flex items-center gap-1">
                <li>
                  <Link
                    href={routes.generalProjectsView}
                    className="hover:text-[#0EA5E9] transition-colors"
                  >
                    Projects
                  </Link>
                </li>
                <li className="px-1 text-xs text-gray-400">/</li>
                <li className="text-gray-900 font-medium truncate max-w-xs sm:max-w-md">
                  {project.title}
                </li>
              </ol>
            </nav>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Project Details */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader >
                    <CardTitle className="text-2xl flex items-center gap-4 justify-between">
                      {project.title}
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium capitalize ${getStatusBadgeClasses(
                          project.status,
                        )}`}
                      >
                        {project.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-lg">
                      {project.organization_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>{project.description}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-semibold mb-2">Project Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(
                                project.start_date,
                              ).toLocaleDateString()}{" "}
                              -{" "}
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

                      <div>
                        {project.completed_project_link && (
                          <>
                            <a
                              href={project.completed_project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-diaspora-darkBlue hover:underline"
                            >
                              View Project Outcome
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {project.closing_remarks && (
                      <div className="mt-4 p-2 border rounded">
                        <h4 className="font-semibold mb-2">Closing Remarks</h4>
                        <p className="text-gray">{project.closing_remarks}</p>
                      </div>
                    )}
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
        </section>
      </main>
    </div>
  );
}
