"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Mail, Calendar, Star, Phone, StarOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";

/** Format date string to "Month Day" (e.g. "March 15") for display only. */
function formatMonthDay(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  profile_picture?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  skills: string[];
  availability: string;
  experience?: string | null;
  residence_country: string;
  residence_state?: string | null;
  volunteer_countries: string[];
  volunteer_states: string[];
  volunteer_lgas: string[];
  average_rating: number;
  anonymous?: boolean;
}

interface AssignedVolunteersTableProps {
  projectId: string;
  volunteers: Volunteer[];
  onRatingSubmitted?: () => void;
}

export function AssignedVolunteersTable({ projectId, volunteers, onRatingSubmitted }: AssignedVolunteersTableProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [ratingsMap, setRatingsMap] = useState<Record<string, { rating: number; comment?: string | null }>>({});
  const [averageRatingsMap, setAverageRatingsMap] = useState<Record<string, number>>({});
  const [rateModalVolunteer, setRateModalVolunteer] = useState<Volunteer | null>(null);
  const [rateValue, setRateValue] = useState(0);
  const [rateComment, setRateComment] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId || volunteers.length === 0) return;
    const loadRatings = async () => {
      const [{ data: projectRatings }, { data: allRatings }] = await Promise.all([
        supabase
          .from("volunteer_ratings")
          .select("volunteer_id, rating, comment")
          .eq("project_id", projectId),
        supabase
          .from("volunteer_ratings")
          .select("volunteer_id, rating")
          .in(
            "volunteer_id",
            volunteers.map((v) => v.volunteer_id)
          ),
      ]);

      const map: Record<string, { rating: number; comment?: string | null }> = {};
      (projectRatings ?? []).forEach((r: { volunteer_id: string; rating: number; comment?: string | null }) => {
        map[r.volunteer_id] = { rating: r.rating, comment: r.comment };
      });
      setRatingsMap(map);

      const totals: Record<string, { sum: number; count: number }> = {};
      (allRatings ?? []).forEach((r: { volunteer_id: string; rating: number }) => {
        if (!totals[r.volunteer_id]) totals[r.volunteer_id] = { sum: 0, count: 0 };
        totals[r.volunteer_id].sum += r.rating;
        totals[r.volunteer_id].count += 1;
      });

      const avgMap: Record<string, number> = {};
      volunteers.forEach((v) => {
        const t = totals[v.volunteer_id];
        avgMap[v.volunteer_id] = t && t.count > 0 ? t.sum / t.count : v.average_rating;
      });
      setAverageRatingsMap(avgMap);
    };
    loadRatings();
  }, [projectId, volunteers]);

  const handleOpenRateModal = (v: Volunteer, e: React.MouseEvent) => {
    e.stopPropagation();
    setRateModalVolunteer(v);
    setRateValue(ratingsMap[v.volunteer_id]?.rating ?? 0);
    setRateComment(ratingsMap[v.volunteer_id]?.comment ?? "");
  };

  const handleSubmitRating = async () => {
    if (!rateModalVolunteer || rateValue < 1) {
      toast({ title: "Select a rating (1–5 stars)", variant: "destructive" });
      return;
    }
    setRateLoading(true);
    try {
      const { data: userId } = await getUserId();
      if (!userId) throw new Error("Please log in.");

      const { error } = await supabase.from("volunteer_ratings").upsert(
        {
          project_id: projectId,
          volunteer_id: rateModalVolunteer.volunteer_id,
          rater_id: userId,
          rating: rateValue,
          comment: rateComment.trim() || null,
        },
        { onConflict: "project_id,volunteer_id" }
      );
      if (error) throw error;

      setRatingsMap((prev) => ({
        ...prev,
        [rateModalVolunteer.volunteer_id]: { rating: rateValue, comment: rateComment.trim() || null },
      }));
      const { data: volunteerRatings } = await supabase
        .from("volunteer_ratings")
        .select("rating")
        .eq("volunteer_id", rateModalVolunteer.volunteer_id);
      if (volunteerRatings && volunteerRatings.length > 0) {
        const avg =
          volunteerRatings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
          volunteerRatings.length;
        setAverageRatingsMap((prev) => ({ ...prev, [rateModalVolunteer.volunteer_id]: avg }));
      }
      setRateModalVolunteer(null);
      toast({ title: "Rating submitted", description: `Rated ${rateModalVolunteer.full_name}` });
      onRatingSubmitted?.();
    } catch (err: any) {
      toast({ title: "Failed to submit rating", description: err.message, variant: "destructive" });
    } finally {
      setRateLoading(false);
    }
  };

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <p className="text-gray-500 text-lg">No volunteers assigned yet</p>
        <p className="text-sm text-gray-400 mt-2">Volunteers will appear here once they join the project</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Volunteer</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.map((volunteer) => (
              <TableRow
                key={volunteer.volunteer_id}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedVolunteer(volunteer)}
              >
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={volunteer.profile_picture || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {volunteer.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{volunteer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>
                      {[volunteer.residence_state, volunteer.residence_country]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill.replace(/_/g, " ")}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{volunteer.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {volunteer.availability || "N/A"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant={ratingsMap[volunteer.volunteer_id] ? "secondary" : "outline"}
                    size="sm"
                    onClick={(e) => handleOpenRateModal(volunteer, e)}
                    className="gap-1"
                  >
                    {ratingsMap[volunteer.volunteer_id] ? (
                      <>
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {ratingsMap[volunteer.volunteer_id].rating}/5
                      </>
                    ) : (
                      <>
                        <StarOff className="h-4 w-4" />
                        Rate
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Volunteer Details Modal – agency always sees full info for assigned volunteers */}
      <Dialog open={!!selectedVolunteer} onOpenChange={() => setSelectedVolunteer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVolunteer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-diaspora-blue/20 shrink-0">
                    <AvatarImage src={selectedVolunteer.profile_picture || undefined} alt="" />
                    <AvatarFallback className="text-2xl bg-diaspora-blue/10 text-diaspora-darkBlue">
                      {selectedVolunteer.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="block truncate">{selectedVolunteer.full_name}</span>
                    <p className="text-sm font-normal text-muted-foreground mt-1">Assigned volunteer</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Personal & contact info – always shown for assigned (agency) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${selectedVolunteer.email}`}
                      className="flex items-center gap-2 text-diaspora-blue hover:underline break-all"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {selectedVolunteer.email}
                    </a>
                  </div>
                  {selectedVolunteer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${selectedVolunteer.phone}`}
                        className="flex items-center gap-2 text-diaspora-blue hover:underline"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {selectedVolunteer.phone}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Date of birth</p>
                    <p className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatMonthDay(selectedVolunteer.date_of_birth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedVolunteer.availability}
                    </Badge>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Location</p>
                  <div className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span>
                      {[selectedVolunteer.residence_state, selectedVolunteer.residence_country]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Experience */}
                {selectedVolunteer.experience && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Experience</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-3">
                      {selectedVolunteer.experience}
                    </p>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteer.skills.map((skill) => (
                      <Badge key={skill} className="bg-diaspora-blue/10 text-diaspora-darkBlue border-diaspora-blue/20">
                        {skill.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-bold">
                      {(averageRatingsMap[selectedVolunteer.volunteer_id] ?? selectedVolunteer.average_rating).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Average rating</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rate Volunteer Modal */}
      <Dialog open={!!rateModalVolunteer} onOpenChange={() => !rateLoading && setRateModalVolunteer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {rateModalVolunteer?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Rating (required)</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRateValue(n)}
                    className="p-2 rounded-md border hover:bg-muted transition-colors"
                  >
                    <Star
                      className={`h-8 w-8 ${rateValue >= n ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{rateValue}/5 stars</p>
            </div>
            <div>
              <label htmlFor="rate-comment" className="text-sm font-medium">
                Comment (optional)
              </label>
              <Textarea
                id="rate-comment"
                placeholder="Share feedback about this volunteer..."
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
                rows={3}
                className="mt-1 resize-none"
                disabled={rateLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateModalVolunteer(null)} disabled={rateLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRating} disabled={rateLoading || rateValue < 1} className="action-btn">
              {rateLoading ? "Saving..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}