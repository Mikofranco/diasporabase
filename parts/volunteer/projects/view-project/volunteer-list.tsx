// components/project/VolunteersList.tsx
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CalendarDays } from "lucide-react";

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  joined_at: string;
}

interface VolunteersListProps {
  volunteers: Volunteer[];
}

export default function VolunteersList({ volunteers }: VolunteersListProps) {
  if (volunteers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No volunteers registered yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {volunteers.map((v) => (
        <Card key={v.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center shrink-0">
              {v.avatar_url ? (
                <img
                  src={v.avatar_url}
                  alt={v.full_name}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <Users className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold truncate">{v.full_name}</h4>
              <p className="text-sm text-muted-foreground truncate">{v.email}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Joined {format(new Date(v.joined_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}