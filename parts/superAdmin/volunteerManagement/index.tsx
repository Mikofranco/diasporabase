"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  skills: string[];
  projects: { id: string; title: string }[];
}

const VolunteersManagement: React.FC = () => {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchUserAndVolunteers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!['admin', 'super_admin'].includes(profile.role)) {
          toast.error('You do not have permission to manage volunteers.');
          setLoading(false);
          return;
        }

        setUserRole(profile.role);

        // Fetch volunteers
        const { data: volunteersData, error: volunteersError } = await supabase
          .from('profiles')
          .select('id, full_name, email, is_active, skills')
          .eq('role', 'volunteer');

        if (volunteersError) throw volunteersError;

        // Fetch confirmed projects from project_volunteers
        const volunteersWithProjects = await Promise.all(//@ts-ignore
          volunteersData.map(async (volunteer) => {
            const { data: projectsData, error: projectsError } = await supabase
              .from('project_volunteers')
              .select('project:projects(id, title)')
              .eq('volunteer_id', volunteer.id);

            if (projectsError) throw projectsError;

            return {
              ...volunteer,
              projects: projectsData.map((req: any) => req.project),
            };
          })
        );

        setVolunteers(volunteersWithProjects);
        setFilteredVolunteers(volunteersWithProjects);
      } catch (err) {
        toast.error('Error fetching data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndVolunteers();
  }, [router]);

  // Update filtered volunteers when statusFilter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredVolunteers(volunteers);
    } else {
      const isActive = statusFilter === 'active';
      setFilteredVolunteers(volunteers.filter((volunteer) => volunteer.is_active === isActive));
    }
  }, [statusFilter, volunteers]);

  const handleRowClick = (volunteerId: string) => {
    router.push(`/admin/volunteers/${volunteerId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Volunteers</h1>
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-800">Volunteers List</CardTitle>
          <div className="w-40">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              aria-label="Filter volunteers by status"
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVolunteers.length === 0 ? (
            <p className="text-muted-foreground text-center">
              {statusFilter === 'all'
                ? 'No volunteers found.'
                : `No ${statusFilter} volunteers found.`}
            </p>
          ) : (
            <Table>
              <TableHeader className='bg-gray-100 text-black'>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Projects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer) => (
                  <TableRow
                    key={volunteer.id}
                    className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleRowClick(volunteer.id)}
                  >
                    <TableCell className="font-medium">{volunteer.full_name}</TableCell>
                    <TableCell>{volunteer.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          volunteer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        )}
                      >
                        {volunteer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {volunteer.skills?.length ? (
                          volunteer.skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          'None'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {volunteer.projects.length ? (
                        volunteer.projects.map((project) => (
                          <Badge key={project.id} variant="secondary" className="mr-1">
                            {project.title}
                          </Badge>
                        ))
                      ) : (
                        'None'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteersManagement;