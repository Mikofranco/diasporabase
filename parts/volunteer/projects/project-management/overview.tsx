import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/lib/types";
import { formatLocation } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface OverviewTabProps {
  project: Project;
}


export function OverviewTab({ project }: OverviewTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {project.description || "No description provided."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent>{/*@ts-ignore*/}
            <p className="text-gray-700">{formatLocation(project)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {project.category}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
}