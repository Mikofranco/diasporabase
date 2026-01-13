import { Card, CardContent } from "@/components/ui/card";
import { Project, Volunteer } from "@/lib/types";
import { getProjectVolunteers } from "@/services/projects";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import VolunteersList from "../view-project/volunteer-list";

interface TeamTabProps {
  project: Project;
  projectId: string;
}

export function TeamTab({ project, projectId }: TeamTabProps) {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  // TODO: Fetch and display volunteers from "project_volunteers" and "profiles" tables
  useEffect(()=>{
    const fetchVolunteers = async () => {
        const { volunteers:fetchedVolunteers, error } = await getProjectVolunteers(projectId);
        if (error) {
          console.error("Error fetching volunteers:", error);
        } else if (fetchedVolunteers) {
            console.log("Fetched volunteers:", fetchedVolunteers);//@ts-ignore
            setVolunteers(fetchedVolunteers.map((v: any) => ({
                id: v.volunteer_id,
                full_name: v.profiles.full_name,
                email: v.profiles.email,
                avatar_url: v.profiles.profile_picture,
                joined_at: v.created_at,
            })));
        }
    }
    fetchVolunteers();
  },[])

  // Add features like approve/reject requests from "volunteer_requests" or "agency_requests"
  // Track hours from "volunteer_hours", add messaging, etc.

  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Users className="h-20 w-20 text-gray-400 mx-auto mb-6" />
        <h3 className="text-2xl font-semibold mb-3 text-diaspora-darkBlue">
          {volunteers.length} Volunteer
          {volunteers.length !== 1 ? "s" : ""} Registered
        </h3>
        <p className="text-gray-600 max-w-md mx-auto text-sm mb-10">
          View volunteer profiles, approve requests, track hours, and
          communicate with your team.
        </p>

        <VolunteersList volunteers={volunteers}/>

        {/* Future: Add volunteer list, requests, messaging */}
       {/* <VolunteersList volunteers={volunteers}/> */}
      </CardContent>
    </Card>
  );
}