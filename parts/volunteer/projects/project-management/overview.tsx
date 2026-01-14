import { ClosingRemarksModal } from "@/components/closing-remarks";
import { EditProjectModal } from "@/components/modals/edit-project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";

interface OverviewTabProps {
  project: Project;
}

export function OverviewTab({ project }: OverviewTabProps) {
  const router = useRouter();
  const [showAllSkills, setShowAllSkills] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="">
          <CardTitle>Description</CardTitle>
          
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {project.description || "No description provided."}
          </p>
          <EditProjectModal
            project={project}
            projectManagerId={"9cd9749a-1bd1-4505-b2f6-b0c105998e59"}
          />
        </CardContent>
      </Card>
      {project.required_skills && project.required_skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-400">Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.required_skills
                .slice(0, showAllSkills ? project.required_skills.length : 15)
                .map((skill: string) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="py-1.5 px-3 text-sm font-medium"
                  >
                    {skill}
                  </Badge>
                ))}
            </div>

            {project.required_skills.length > 10 && (
              <div className="mt-4">
                <Button
                  variant="link"
                  className="text-diaspora-blue hover:text-diaspora-blue/90 px-0 h-auto font-medium"
                  onClick={() => setShowAllSkills(!showAllSkills)}
                >
                  {showAllSkills
                    ? "Show less"
                    : `Show all (${project.required_skills.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                projectId={project.id} //@ts-ignore
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
