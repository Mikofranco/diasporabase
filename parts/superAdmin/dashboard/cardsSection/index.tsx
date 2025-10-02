import React, { useEffect, useState } from 'react';
import SmallCard from './small-card';
import { supabase } from '@/lib/supabase/client';
import { Project } from '@/lib/types';

const fetchProjectsByStatus = async (status: string): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', status);

  if (error) {
    console.error(`Error fetching projects with status ${status}:`, error);
    return [];
  }

  return data || [];
};

const fetchTotalAgencies = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'agency');

  if (error) {
    console.error('Error fetching agencies:', error);
    return 0;
  }

  return data?.length || 0;
};

const CardsSection = () => {
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [approvedProjects, setApprovedProjects] = useState<Project[]>([]);
  const [rejectedProjects, setRejectedProjects] = useState<Project[]>([]);
  const [totalAgencies, setTotalAgencies] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [pending, approved, rejected, agencies] = await Promise.all([
          fetchProjectsByStatus('pending'),
          fetchProjectsByStatus('active'),
          fetchProjectsByStatus('cancelled'),
          fetchTotalAgencies(),
        ]);

        setPendingProjects(pending);
        setApprovedProjects(approved);
        setRejectedProjects(rejected);
        setTotalAgencies(agencies);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">  
      {Array.from({ length: 4 }).map((_, index) => (
        <SmallCard key={index} count={0} image="/svg/placeholder.svg" title="Loading..." />
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SmallCard 
        count={pendingProjects.length} 
        image="/svg/admin-pending-project.svg" 
        title="Pending Requests" 
      />
      <SmallCard 
        count={approvedProjects.length} 
        image="/svg/admin-approved.svg" 
        title="Approved Projects" 
      />
      <SmallCard 
        count={totalAgencies} 
        image="/svg/admin-total.svg" 
        title="Total Agencies" 
      />
      <SmallCard 
        count={rejectedProjects.length} 
        image="/svg/admin-rejcted.svg" 
        title="Rejected Projects" 
      />
    </div>
  );
};

export default CardsSection;