"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, User, Mail, List, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckboxReactHookFormMultiple } from '@/components/renderedItems';
import { expertiseData } from '@/data/expertise';

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  skills: string[];
  projects: { id: string; title: string }[];
}

interface FormData {
  full_name: string;
  email: string;
  skills: string[];
}

const AdminVolunteerDetails: React.FC = () => {
  const { volunteerId } = useParams();
  const router = useRouter();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { control, handleSubmit, setValue, reset } = useForm<FormData>();
  const [customSkill, setCustomSkill] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserAndVolunteer = async () => {
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
          toast.error('You do not have permission to view this page.');
          setLoading(false);
          return;
        }

        setUserRole(profile.role);

        if (!volunteerId || typeof volunteerId !== 'string') {
          throw new Error('Invalid volunteer ID');
        }

        const { data: volunteerData, error: volunteerError } = await supabase
          .from('profiles')
          .select('id, full_name, email, is_active, skills')
          .eq('id', volunteerId)
          .eq('role', 'volunteer')
          .single();

        if (volunteerError) throw volunteerError;

        const { data: projectsData, error: projectsError } = await supabase
          .from('volunteer_requests')
          .select('project:projects(id, title)')
          .eq('volunteer_id', volunteerId)
          .eq('status', 'accepted');

        if (projectsError) throw projectsError;

        setVolunteer({
          ...volunteerData,
          projects: projectsData.map((req: any) => req.project),
        });

        setValue('full_name', volunteerData.full_name);
        setValue('email', volunteerData.email);
        setValue('skills', volunteerData.skills || []);
      } catch (err) {
        toast.error('Error fetching data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndVolunteer();
  }, [volunteerId, router, setValue]);

  const handleToggleActive = async () => {
    if (!volunteer) return;
    try {
      const newStatus = !volunteer.is_active;
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', volunteerId);

      if (error) throw error;

      setVolunteer((prev) => prev ? { ...prev, is_active: newStatus } : null);
      toast.success(`Volunteer ${newStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (err) {
      toast.error('Error toggling status: ' + (err as Error).message);
    }
  };

  const handleCustomSkillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSkill(event.target.value);
  };

  const addCustomSkill = () => {
    if (customSkill.trim()) {
      const currentSkills = control._formValues.skills || [];
      if (!currentSkills.includes(customSkill.trim())) {
        setValue('skills', [...currentSkills, customSkill.trim()]);
        toast.success(`Added skill: ${customSkill.trim()}`);
      } else {
        toast.error('Skill already added.');
      }
      setCustomSkill('');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          skills: data.skills,
          // updated_at: new Date().toISOString(),
        })
        .eq('id', volunteerId);

      if (error) throw error;

      setVolunteer((prev) =>
        prev ? { ...prev, full_name: data.full_name, email: data.email, skills: data.skills } : null
      );
      toast.success('Volunteer details updated successfully.');
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Error updating volunteer: ' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!volunteer) {
    toast.error('Volunteer not found.');
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-muted-foreground">Volunteer not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{volunteer.full_name}</h1>
      <Card className="shadow-lg border-none max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Volunteer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User className="h-4 w-4" /> Name
            </h3>
            <p className="mt-1 text-gray-900">{volunteer.full_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </h3>
            <p className="mt-1 text-gray-900">{volunteer.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <List className="h-4 w-4" /> Status
            </h3>
            <Badge
              className={cn(
                'mt-1',
                volunteer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}
            >
              {volunteer.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <List className="h-4 w-4" /> Skills
            </h3>
            <div className="mt-1 flex flex-wrap gap-2">
              {volunteer.skills?.length ? (
                volunteer.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-gray-900">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-900">None</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <List className="h-4 w-4" /> Projects
            </h3>
            <div className="mt-1 flex flex-wrap gap-2">
              {volunteer.projects.length ? (
                volunteer.projects.map((project) => (
                  <Badge key={project.id} variant="secondary" className="text-gray-900">
                    {project.title}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-900">None</p>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleToggleActive}
              className={cn(
                'flex items-center gap-2',
                volunteer.is_active
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              )}
              aria-label={volunteer.is_active ? 'Deactivate volunteer' : 'Activate volunteer'}
            >
              {volunteer.is_active ? (
                <>
                  <ToggleLeft className="h-4 w-4" /> Deactivate
                </>
              ) : (
                <>
                  <ToggleRight className="h-4 w-4" /> Activate
                </>
              )}
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 transition-all duration-300"
                  aria-label="Edit volunteer details"
                >
                  Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Volunteer Details</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" className="text-sm font-medium text-gray-600">
                      Full Name
                    </Label>
                    <Controller
                      name="full_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="full_name"
                          {...field}
                          placeholder="Enter full name"
                          className="mt-1"
                          aria-label="Volunteer full name"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-600">
                      Email
                    </Label>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="email"
                          type="email"
                          {...field}
                          placeholder="Enter email"
                          className="mt-1"
                          aria-label="Volunteer email"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Skills</Label>
                    <Controller
                      name="skills"
                      control={control}
                      defaultValue={volunteer.skills || []}
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
                    disabled={control._formValues.skills?.length === 0}
                  >
                    Save Changes
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVolunteerDetails;