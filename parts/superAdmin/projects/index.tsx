"use client"
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/project-card';
import { useRouter } from 'next/navigation';

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
}

const supabase = createClient();

const AdminProjectsScreen: React.FC = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Fetch user role and projects
  useEffect(() => {
    const fetchUserAndProjects = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }

        // Fetch user profile to get role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!['admin', 'super_admin'].includes(profile.role)) {
          setError('You do not have permission to view this page.');
          setLoading(false);
          return;
        }

        setUserRole(profile.role);

        // Fetch all projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, organization_name, description, start_date, end_date, category, volunteers_registered, volunteers_needed, status');

        if (projectsError) throw projectsError;

        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (err) {
        setError('Error fetching data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProjects();
  }, [router]);

  // Handle status filter change
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter((project) => project.status === statusFilter));
    }
  }, [statusFilter, projects]);

  // Handle project selection
  const handleProjectSelect = (project: Project) => {
    router.push(`/dashboard/admin/projects/${project.id}`);
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Projects</h1>
      <div className="mb-6">
        <Select onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filteredProjects.length === 0 ? (
        <p className="text-muted-foreground">No projects found for the selected status.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              handleProjectSelect={handleProjectSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjectsScreen;