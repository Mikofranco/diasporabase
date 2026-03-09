"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  Star,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Volunteer } from "@/lib/types";
import { getStatusColor } from "./utils";
import { useSkillLabels } from "@/hooks/useSkillLabels";

export type VolunteerWithRequest = Volunteer & {
  hasRequested?: { hasRequested?: boolean };
};

interface VolunteerCardProps {
  volunteer: VolunteerWithRequest;
  volunteersRegistered: number;
  volunteersNeeded: number;
  onOpenRequestDialog: (volunteer: Volunteer) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLocation(volunteer: Volunteer): string {
  const state =
    volunteer.residence_state || volunteer.volunteer_states?.[0] || "";
  const country =
    volunteer.residence_country || volunteer.volunteer_countries?.[0] || "";
  if (!state && !country) return "Location not set";
  return [state, country].filter(Boolean).join(", ");
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />;
    case "accepted":
      return <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
    case "rejected":
      return <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
    default:
      return null;
  }
}

function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function VolunteerCard({
  volunteer,
  volunteersRegistered,
  volunteersNeeded,
  onOpenRequestDialog,
}: VolunteerCardProps) {
  const { getLabel } = useSkillLabels();
  const matchedSkills = volunteer.matched_skills ?? [];
  const skills = volunteer.skills ?? [];
  const displaySkills = skills.slice(0, 4);
  const remainingCount = Math.max(0, skills.length - 4);
  const isLimitReached = volunteersRegistered >= volunteersNeeded;
  const hasRequested = volunteer.hasRequested?.hasRequested;
  const rating = volunteer.average_rating ?? 0;
  const hasRating = rating > 0;
  const isAnonymous = volunteer.anonymous === true;
  const avatarUrl =
    volunteer.avatar_url ??
    volunteer.profile?.profile_picture ??
    volunteer.profile?.profilePicture;

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden border border-border bg-card text-card-foreground transition-all duration-200 hover:border-ring/30 hover:shadow-md",
        volunteer.request_status && "opacity-95"
      )}
    >
      {/* Accent bar – app brand gradient when no status */}
      <div
        className={cn(
          "absolute left-0 top-0 h-1 w-full",
          volunteer.request_status
            ? "bg-muted"
            : "opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-diaspora-blue to-diaspora-darkBlue"
        )}
      />

      <CardContent className="flex-1 p-5">
        {/* Not-yet-added: respect anonymous – hide personal info when anonymous */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 shrink-0 border-2 border-background shadow-sm ring-1 ring-border">
            {!isAnonymous && avatarUrl && (
              <AvatarImage src={avatarUrl} alt="" className="object-cover" />
            )}
            <AvatarFallback className="bg-gradient-to-r from-diaspora-blue to-diaspora-darkBlue text-white text-sm font-semibold">
              {isAnonymous ? "?" : getInitials(volunteer.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-card-foreground line-clamp-1" title={isAnonymous ? undefined : volunteer.full_name}>
              {isAnonymous ? "Volunteer" : volunteer.full_name}
            </p>
            {!isAnonymous && (
              <a
                href={`mailto:${volunteer.email}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-card-foreground truncate max-w-full"
                title={volunteer.email}
              >
                <span className="truncate">{volunteer.email}</span>
              </a>
            )}
            {isAnonymous && (
              <p className="text-xs text-muted-foreground">Skills, location & experience only</p>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {displaySkills.map((skill) => {
              const isMatched = matchedSkills.includes(skill);
              return (
                <Badge
                  key={skill}
                  variant={isMatched ? "default" : "secondary"}
                  className={cn(
                    "text-xs font-medium px-2 py-0",
                    isMatched && "ring-1 ring-ring/50 bg-ring/10 text-ring border-ring/30"
                  )}
                >
                  {getLabel(skill)}
                </Badge>
              );
            })}
            {remainingCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-xs cursor-help"
                  >
                    +{remainingCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium mb-1">More skills</p>
                  <p className="text-muted-foreground text-xs">
                    {skills.slice(4).map(getLabel).join(", ")}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden />
          <span className="line-clamp-2" title={formatLocation(volunteer)}>
            {formatLocation(volunteer)}
          </span>
        </div>

        {/* Experience – summary only (no personal info) */}
        {(volunteer.experience ?? volunteer.profile?.experience) && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Experience</p>
            <p className="text-sm text-card-foreground line-clamp-3">
              {(volunteer.experience ?? volunteer.profile?.experience) ?? ""}
            </p>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Star
            className={cn(
              "h-4 w-4 shrink-0",
              hasRating ? "fill-ring text-ring" : "text-muted-foreground/50"
            )}
            aria-hidden
          />
          <span className="text-sm font-medium tabular-nums text-card-foreground">
            {hasRating ? rating.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">/ 5</span>
          {!hasRating && (
            <span className="text-xs text-muted-foreground">(no reviews)</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-border bg-muted/50 p-4">
        {volunteer.request_status ? (
          <div
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
              getStatusColor(volunteer.request_status)
            )}
            role="status"
            aria-label={`Request status: ${getStatusLabel(volunteer.request_status)}`}
          >
            {getStatusIcon(volunteer.request_status)}
            <span>{getStatusLabel(volunteer.request_status)}</span>
          </div>
        ) : hasRequested ? (
          <Button disabled className="w-full" variant="secondary">
            <Clock className="h-4 w-4 mr-2 shrink-0" aria-hidden />
            Awaiting approval
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full inline-block">
                <Button
                  className={cn(
                    "w-full action-btn",
                    isLimitReached && "pointer-events-none opacity-60"
                  )}
                  onClick={() => onOpenRequestDialog(volunteer)}
                  disabled={isLimitReached}
                  aria-label="Send project request to this volunteer"
                >
                  <Send className="h-4 w-4 mr-2 shrink-0" aria-hidden />
                  Send request
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {isLimitReached
                ? `All ${volunteersNeeded} volunteer slots are filled.`
                : "Invite this volunteer to the project."}
            </TooltipContent>
          </Tooltip>
        )}
      </CardFooter>
    </Card>
  );
}
