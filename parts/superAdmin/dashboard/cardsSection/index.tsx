import React, { useEffect, useState } from 'react';
import SmallCard from './small-card';
import { supabase } from '@/lib/supabase/client';
import { Users, Building2, Briefcase } from 'lucide-react';

const CardsSection = () => {
  const [totalVolunteers, setTotalVolunteers] = useState<number>(0);
  const [totalAgencies, setTotalAgencies] = useState<number>(0);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [
          { count: volunteersCount },
          { count: agenciesCount },
          { count: projectsCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'volunteer'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agency'),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
        ]);

        setTotalVolunteers(volunteersCount ?? 0);
        setTotalAgencies(agenciesCount ?? 0);
        setTotalProjects(projectsCount ?? 0);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <SmallCard key={i} count={0} title="Loading..." />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-w-0">
      <SmallCard
        count={totalVolunteers}
        icon={<Users />}
        title="Total Volunteers"
      />
      <SmallCard
        count={totalAgencies}
        icon={<Building2 />}
        title="Total Agencies"
      />
      <SmallCard
        count={totalProjects}
        icon={<Briefcase />}
        title="Total Projects"
      />
    </div>
  );
};

export default CardsSection;