// app/dashboard/volunteer/projects/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { MapPin, Briefcase, Calendar, Users, Star, ArrowLeft } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";

const supabase = createClient();

interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
  required_skills: string[] | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Rating {
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// Zod schema for rating form
const ratingSchema = z.object({
  rating: z.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(500, "Comment cannot exceed 500 characters").optional(),
});

const VolunteerProjectDetails: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const form = useForm<z.infer<typeof ratingSchema>>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  useEffect(() => {
    const fetchProjectAndUser = async () => {
      setLoading(true);
      setError(null);

      if (!id || id === "undefined" || typeof id !== "string") {
        setError("Invalid project ID.");
        setLoading(false);
        toast.error("Invalid project ID.");
        return;
      }

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view project details.");

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", userId)
          .single();

        if (profileError) throw new Error("Error fetching profile: " + profileError.message);
        if (!profileData || profileData.role !== "volunteer") {
          throw new Error("Only volunteers can access this page.");
        }

        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select(
            "id, title, description, organization_name, organization_id,location, start_date, end_date, volunteers_registered, status, category, required_skills, created_at"
          )
          .eq("id", id)
          .eq("status", "active")
          .single();

        if (projectError) throw new Error("Error fetching project: " + projectError.message);
        if (!projectData) throw new Error("Project not found or not active.");

        // Fetch ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("project_ratings")
          .select("user_name, rating, comment, created_at")
          .eq("project_id", id)
          .order("created_at", { ascending: false });

        if (ratingsError) throw new Error("Error fetching ratings: " + ratingsError.message);

        // Check if user has already requested to volunteer
        const { data: requestData, error: requestError } = await supabase
          .from("volunteer_requests")
          .select("id")
          .eq("project_id", id)
          .eq("volunteer_id", userId)
          .eq("status", "pending");

        if (requestError) throw new Error("Error checking volunteer request: " + requestError.message);

        // Check if user has already rated the project
        const { data: ratingData, error: ratingError } = await supabase
          .from("project_ratings")
          .select("id")
          .eq("project_id", id)
          .eq("user_id", userId);

        if (ratingError) throw new Error("Error checking rating: " + ratingError.message);

        setProfile(profileData);
        setProject(projectData);
        setRatings(ratingsData || []);
        setHasRequested(!!requestData && requestData.length > 0);
        setHasRated(!!ratingData && ratingData.length > 0);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndUser();
  }, [id]);

  const handleVolunteerRequest = async () => {
    if (!profile) {
      toast.error("Please log in to volunteer.");
      return;
    }

    try {
      const { error } = await supabase
        .from("volunteer_requests")
        .insert({ project_id: id, volunteer_id: profile.id, status: "pending", organization_id: project?.organization_id });

      if (error) throw new Error("Error submitting volunteer request: " + error.message);

      setHasRequested(true);
      toast.success("Volunteer request submitted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRatingSubmit = async (data: z.infer<typeof ratingSchema>) => {
    if (!profile) {
      toast.error("Please log in to rate this project.");
      return;
    }

    try {
      const { error } = await supabase
        .from("project_ratings")
        .insert({
          project_id: id,
          user_id: profile.id,
          user_name: profile.full_name,
          email: profile.email,
          rating: data.rating,
          comment: data.comment || null,
        });

      if (error) throw new Error("Error submitting rating: " + error.message);

      setHasRated(true);
      setRatings([
        {
          user_name: profile.full_name,
          rating: data.rating,
          comment: data.comment || null,
          created_at: new Date().toISOString(),
        },
        ...ratings,
      ]);
      toast.success("Rating submitted successfully!");
      form.reset();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-1/2 rounded-lg" />
        <Card className="shadow-lg">
          <CardContent className="space-y-6 pt-6">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-10 w-1/3 rounded-lg" />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="space-y-6 pt-6">
            <Skeleton className="h-8 w-1/2 rounded-lg" />
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-10 w-1/3 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-xl text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">{error}</CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => router.push("/dashboard/volunteer/opportunities")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-gray-700">Project Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">The requested project could not be found.</CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => router.push("/dashboard/volunteer/opportunities")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{project.title}</h1>
        <Button
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
          onClick={() => router.push("/dashboard/volunteer/opportunities")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>
      </div>

      <Card className="shadow-lg border-0 bg-white rounded-xl">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-2xl font-semibold text-gray-900">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed text-base">{project.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-gray-600 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                  Organization
                </Label>
                <p className="text-gray-900 font-medium">{project.organization_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  Location
                </Label>
                <p className="text-gray-900 font-medium">{project.location}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  Duration
                </Label>
                <p className="text-gray-900 font-medium">
                  {new Date(project.start_date).toLocaleDateString()} -{" "}
                  {new Date(project.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  Volunteers
                </Label>
                <p className="text-gray-900 font-medium">
                  {project.volunteers_registered}/{project.volunteers_needed}
                </p>
                <Progress
                  value={(project.volunteers_registered / project.volunteers_needed) * 100}
                  className="mt-2 h-2"
                  aria-label={`Volunteer slots filled: ${project.volunteers_registered} out of ${project.volunteers_needed}`}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Category</Label>
                <Badge className="bg-blue-600 text-white hover:bg-blue-700 mt-1">
                  {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                </Badge>
              </div>
              {project.required_skills && project.required_skills.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Required Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {project.required_skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-sm border-gray-300 text-gray-700"
                      >
                        {skill.charAt(0).toUpperCase() + skill.slice(1).replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={handleVolunteerRequest}
            disabled={hasRequested || project.volunteers_registered >= project.volunteers_needed}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 rounded-lg transition-colors duration-200"
            aria-disabled={hasRequested || project.volunteers_registered >= project.volunteers_needed}
          >
            {hasRequested
              ? "Request Submitted"
              : project.volunteers_registered >= project.volunteers_needed
              ? "Volunteer Slots Full"
              : "Apply to Volunteer"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white rounded-xl">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-2xl font-semibold text-gray-900">Rate This Project</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {hasRated ? (
            <p className="text-gray-600 text-base">You have already rated this project.</p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRatingSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600 flex items-center">
                        <Star className="h-4 w-4 mr-2 text-gray-500" />
                        Rating
                      </FormLabel>
                      <FormControl>
                        <div
                          className="flex gap-2"
                          role="radiogroup"
                          aria-label="Select a rating from 1 to 5 stars"
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Button
                              key={value}
                              type="button"
                              variant="ghost"
                              className={`p-2 transition-colors duration-200 ${
                                (hoveredRating || field.value) >= value
                                  ? "text-yellow-500"
                                  : "text-gray-400"
                              } hover:text-yellow-600`}
                              onClick={() => field.onChange(value)}
                              onMouseEnter={() => setHoveredRating(value)}
                              onMouseLeave={() => setHoveredRating(null)}
                              aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                            >
                              <Star
                                className="h-8 w-8"
                                fill={(hoveredRating || field.value) >= value ? "currentColor" : "none"}
                              />
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        Comment (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Share your feedback about this project..."
                          className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                          aria-describedby="comment-description"
                        />
                      </FormControl>
                      <p id="comment-description" className="text-sm text-gray-500 mt-1">
                        Share up to 500 characters of feedback.
                      </p>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 rounded-lg transition-colors duration-200"
                  disabled={form.watch("rating") === 0}
                >
                  Submit Rating
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {ratings.length > 0 && (
        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Project Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {ratings.map((rating, index) => (
              <div
                key={index}
                className="border-b border-gray-200 pb-4 last:border-b-0"
                role="article"
                aria-label={`Review by ${rating.user_name}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-gray-900 font-medium">{rating.user_name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 mt-1" aria-label={`Rating: ${rating.rating} stars`}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-5 w-5 ${
                        value <= rating.rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                      fill={value <= rating.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                {rating.comment && (
                  <p className="text-gray-600 mt-2 text-base">{rating.comment}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VolunteerProjectDetails;