"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface FindVolunteersSearchCardProps {
  searchName: string;
  setSearchName: (v: string) => void;
  searchSkills: string;
  setSearchSkills: (v: string) => void;
  searchMinRating: string;
  setSearchMinRating: (v: string) => void;
  searchLocation: string;
  setSearchLocation: (v: string) => void;
  searching: boolean;
  onSearch: () => void;
  onShowRecommendations: () => void;
}

export function FindVolunteersSearchCard({
  searchName,
  setSearchName,
  searchSkills,
  setSearchSkills,
  searchMinRating,
  setSearchMinRating,
  searchLocation,
  setSearchLocation,
  searching,
  onSearch,
  onShowRecommendations,
}: FindVolunteersSearchCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Search volunteers</CardTitle>
        <p className="text-sm text-muted-foreground">
          Not happy with recommendations? Search by name, skills, rating, or
          location.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              placeholder="Volunteer name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Skills (comma-separated)</Label>
            <Input
              placeholder="e.g. React, Design"
              value={searchSkills}
              onChange={(e) => setSearchSkills(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Min. star rating (0–5)</Label>
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              placeholder="e.g. 4"
              value={searchMinRating}
              onChange={(e) => setSearchMinRating(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input
              placeholder="Country or state..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSearch}
            disabled={searching}
            className="bg-diaspora-blue hover:bg-diaspora-blue/90"
          >
            <Search className="h-4 w-4 mr-2" />
            {searching ? "Searching..." : "Search"}
          </Button>
          <Button variant="outline" onClick={onShowRecommendations}>
            Show recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
