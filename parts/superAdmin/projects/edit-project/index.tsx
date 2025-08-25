"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { CheckboxReactHookFormMultiple } from '@/components/renderedItems';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { expertiseData } from '@/data/expertise';

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

interface FormData {
  required_skills: string[];
  status: 'active' | 'pending' | 'completed' | 'cancelled';
}

const EditProject: React.FC = () => {
  const { projectId } = useParams();
  const router = useRouter();
  const { control, handleSubmit, setValue, formState: { isSubmitting } } = useForm<FormData>();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [customSkill, setCustomSkill] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    const fetchUserAndProject = async () => {
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
          toast.error('You do not have permission to edit projects.');
          setLoading(false);
          return;
        }

        setUserRole(profile.role);

        if (!projectId || typeof projectId !== 'string') {
          throw new Error('Invalid project ID');
        }

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, title, organization_name, description, start_date, end_date, category, volunteers_registered, volunteers_needed, status, required_skills, organization_id')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;

        setProject(projectData);
        setValue('required_skills', projectData.required_skills || []);
        setValue('status', projectData.status);
      } catch (err) {
        toast.error('Error fetching data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProject();
  }, [projectId, router, setValue]);

  const handleCustomSkillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSkill(event.target.value);
  };

  const addCustomSkill = () => {
    if (customSkill.trim()) {
      const currentSkills = control._formValues.required_skills || [];
      if (!currentSkills.includes(customSkill.trim())) {
        setValue('required_skills', [...currentSkills, customSkill.trim()]);
        toast.success(`Added skill: ${customSkill.trim()}`);
      } else {
        toast.error('Skill already added.');
      }
      setCustomSkill('');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          required_skills: data.required_skills,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      if (data.status === 'active' && project?.status !== 'active') {
        const { data: ownerProfile, error: ownerError } = await supabase
          .from('profiles')
          .select('email, organization_name')
          .eq('id', project?.organization_id)
          .single();

        if (ownerError) throw ownerError;

        const { error: emailError } = await supabase.functions.invoke('send-project-approval-email', {
          body: {
            email: ownerProfile.email,
            projectTitle: project?.title,
            organizationName: ownerProfile.organization_name,
          },
        });

        if (emailError) throw emailError;
      }

      toast.success('Project updated successfully!');
      router.push(`/dashboard/admin/projects/${projectId}`);
    } catch (err) {
      toast.error('Error updating project: ' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    toast.error('Project not found.');
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Project: {project.title}</h1>
      <Card className="shadow-lg border-none max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Update Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-gray-600">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="status" className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Required Skills</Label>
              <Controller
                name="required_skills"
                control={control}
                defaultValue={project.required_skills || []}
                render={({ field }) => (
                  <CheckboxReactHookFormMultiple
                    items={expertiseData}
                    onChange={(selectedSkills) => field.onChange(selectedSkills)}
                    initialValues={field.value}
                  />
                )}
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={customSkill}
                onChange={handleCustomSkillChange}
                placeholder="e.g., Machine Learning"
                className="w-full"
                aria-label="Add custom skill"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
                className="flex items-center gap-2"
                aria-label="Add custom skill"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 transition-all duration-300"
              disabled={isSubmitting || !control._formValues.required_skills?.length}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProject;