import { ClosingRemarksModal } from "@/components/closing-remarks";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Project } from "@/lib/types";
import { formatLocation } from "@/lib/utils";
import { CheckCircle2, Flag, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface OverviewTabProps {
  project: Project;
}

export function OverviewTab({ project }: OverviewTabProps) {
  const router = useRouter();
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
          <CardContent>
            {/*@ts-ignore*/}
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
        <div className="space-y-6">
          {project.status === "completed" ? (
            <div className="space-y-3 bg-blue-50 p-4 rounded-md border border-diaspora-blue-100">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Project Completed</span>
              </div>

              <div className="pl-7">
                <p className="text-sm text-gray-500 mb-1">Closing Remarks</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {project.closing_remarks || "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <ClosingRemarksModal
                projectId={project.id}
                currentStatus={project.status}
                isAuthorized={true}
                onProjectClosed={() => router.refresh()}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
