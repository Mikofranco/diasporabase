"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mail, User, Phone, MapPin, Building, Globe } from "lucide-react";
import { AgencyProfile } from "@/lib/types";

interface InfoSectionProps {
  profile: AgencyProfile;
  className?: string;
}

export default function OverviewSection({
  profile,
  className,
}: InfoSectionProps) {
  return (
    <Card
      className={cn("overflow-hidden border shadow-sm space-y-2", className)}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-diaspora-darkBlue">
          Overview
        </CardTitle>
        {profile.description ? (
          <CardDescription>{profile.description}</CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {(profile.organization_type ?? profile.organization_name) && (
            <div className="flex items-start gap-3 min-w-0">
              <Building className="h-5 w-5 text-diaspora-blue shrink-0 mt-0.5" />
              <span className="text-sm text-foreground break-words min-w-0">
                {profile.organization_type || profile.organization_name || "—"}
              </span>
            </div>
          )}
          <div className="flex items-start gap-3 min-w-0">
            <User className="h-5 w-5 text-diaspora-blue shrink-0 mt-0.5" />
            <span className="text-sm text-foreground break-words min-w-0">
              {[profile.full_name, profile.contact_person_first_name, profile.contact_person_last_name]
                .filter(Boolean)
                .join(" ") || profile.organization_name || "—"}
            </span>
          </div>
          <div className="flex items-start gap-3 min-w-0">
            <Mail className="h-5 w-5 text-diaspora-blue shrink-0 mt-0.5" />
            <span className="text-sm text-foreground break-all min-w-0">
              {profile.email ?? "—"}
            </span>
          </div>
          <div className="flex items-start gap-3 min-w-0">
            <Phone className="h-5 w-5 text-diaspora-blue shrink-0 mt-0.5" />
            <span className="text-sm text-foreground break-words min-w-0">
              {profile.phone ?? "—"}
            </span>
          </div>
          {profile.address != null && profile.address !== "" && (
            <div className="flex items-start gap-3 min-w-0">
              <MapPin className="h-5 w-5 text-diaspora-blue shrink-0 mt-0.5" />
              <span className="text-sm text-foreground break-words min-w-0">{profile.address}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-start gap-3 min-w-0">
              <Globe className="h-5 w-5 text-diaspora-blue shrink-0 mt-0.5" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-diaspora-blue hover:underline break-all min-w-0"
              >
                {profile.website}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
