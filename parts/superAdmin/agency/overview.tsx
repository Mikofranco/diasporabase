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
import { Mail, User, Phone, MapPin, Building, FileText } from "lucide-react";
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
        <div className="space-y-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {(profile.organization_type ?? profile.organization_name) && (
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-diaspora-blue shrink-0" />
              <span className="text-sm text-foreground">
                {profile.organization_type || profile.organization_name || "—"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-diaspora-blue shrink-0" />
            <span className="text-sm text-foreground">
              {[profile.full_name, profile.contact_person_first_name, profile.contact_person_last_name]
                .filter(Boolean)
                .join(" ") || profile.organization_name || "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-diaspora-blue shrink-0" />
            <span className="text-sm text-foreground">
              {profile.contact_person_email ?? profile.email ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-diaspora-blue shrink-0" />
            <span className="text-sm text-foreground">
              {profile.contact_person_phone ?? profile.phone ?? "—"}
            </span>
          </div>
          {profile.website && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-diaspora-blue shrink-0" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-diaspora-blue hover:underline"
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
