"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ProjectCard from '@/components/project-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import ProjectRecommendation from '@/parts/agency/projects/project-recommendation';

interface Project {
  id: string;
  title: string;
  organization_name: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string;
  volunteers_registered: number;
  volunteers_needed: number;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  required_skills: string[];
  organization_id: string;
}

const ViewProject: React.FC = () => {
  const { projectId } = useParams(); // Extract projectId from params object
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log("Project ID:", projectId); // Debug: Should log a string
    const fetchUserAndProject = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch user profile to get role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setUserRole(profile.role);

        // Validate projectId
        if (!projectId || typeof projectId !== 'string') {
          throw new Error('Invalid project ID');
        }

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, title, organization_name, description, start_date, end_date, category, volunteers_registered, volunteers_needed, status, required_skills, organization_id')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);
      } catch (err) {
        setError('Error fetching data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProject();
  }, [projectId, router]);

  const handleProjectSelect = (project: Project) => {
    router.push(`/dashboard/admin/projects/${project.id}`);
  };

  const handleEditProject = () => {
    router.push(`/dashboard/admin/projects/${projectId}/edit`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return <p className="text-center mt-6">Project not found.</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{project.title}</h1>
      {/* <ProjectCard project={project} handleProjectSelect={handleProjectSelect} /> */}
      {['admin', 'super_admin'].includes(userRole || '') && (
        <Button
          className="mt-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
          onClick={handleEditProject}
        >
          Edit Project
        </Button>
      )}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Details</h2>
        <p className="mt-2 text-muted-foreground">{project.description}</p>
        <div className="mt-4 space-y-2">
          <p><strong>Category:</strong> {project.category}</p>
          <p><strong>Dates:</strong> {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</p>
          <p><strong>Volunteers:</strong> {project.volunteers_registered}/{project.volunteers_needed}</p>
          <p><strong>Status:</strong> {project.status.charAt(0).toUpperCase() + project.status.slice(1)}</p>
          <p><strong>Required Skills:</strong> {project.required_skills?.join(', ') || 'None'}</p>
        </div>
      </div>

      <ProjectRecommendation projectId={projectId as string}  volunteersNeeded={project.volunteers_needed} volunteersRegistered={project.volunteers_registered}/>
    </div>
  );
};

export default ViewProject;