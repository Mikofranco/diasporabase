import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, } from '@/components/ui/card'; // Adjust path to your Shadcn/UI components
import { Calendar, Users } from 'lucide-react'; // Adjust if using a different icon library
import { cn } from '@/lib/utils'; // Shadcn's utility for className merging
import { Badge } from './ui/badge';
import { Button } from './ui/button';

// Define TypeScript interface for project props
export interface Project {
  id: string;
  title: string;
  organization_name?: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string;
  volunteers_registered: number;
  volunteers_needed: number;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
}

interface ProjectCardProps {
  project: Project;
  handleProjectSelect: (project: Project) => void;
  className?: string; // Optional for additional styling
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, handleProjectSelect, className }) => {
  // Define status styles
  const statusStyles: Record<Project['status'], { bg: string; text: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-800' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  };

  // Capitalize status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card
      className={cn(
        'relative cursor-pointer hover:shadow-lg transition-shadow duration-300',
        className
      )}
    >
      {/* Status Badge in Top-Left Corner */}
      <div
        className={cn(
          'absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium',
          statusStyles[project.status].bg,
          statusStyles[project.status].text
        )}
      >
        {formatStatus(project.status)}
      </div>

      <CardHeader>
        <CardTitle className="text-lg mt-6">{project.title}</CardTitle>
        <CardDescription>{project.organization_name}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {project.description}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(project.start_date).toLocaleDateString()} -{' '}
              {new Date(project.end_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              {project.volunteers_registered}/{project.volunteers_needed} volunteers
            </span>
          </div>
          <Badge variant="secondary">{project.category}</Badge>
        </div>
        <Button
          className="w-full mt-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
          onClick={() => handleProjectSelect(project)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;