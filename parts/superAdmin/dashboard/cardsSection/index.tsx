import React, { useEffect } from 'react'
import SmallCard from './small-card'
import { supabase } from '@/lib/supabase/client';
import { Project } from '@/lib/types';

async function fetchProjectsbyStatus(status: string) {
  supabase.from('projects').select('*').eq('status', status);
}


const CardsSection = () => {
  const [pendingProjects, setPendingProjects] = React.useState<Project>([] as unknown as Project);
  const [approvedProjects, setApprovedProjects] = React.useState<Project>([] as unknown as Project);
  const [rejectedProjects, setRejectedProjects] = React.useState<Project>([] as unknown as Project);
  const [totalAgencies, setTotalAgencies] = React.useState<number>(0);

  useEffect(() => {
    fetchProjectsbyStatus('pending').then((data) => {
      if (data) {
        setPendingProjects(data as unknown as Project);
      }
    });
    fetchProjectsbyStatus('approved').then((data) => {
      if (data) {
        setApprovedProjects(data as unknown as Project);
      }
    });
    fetchProjectsbyStatus('rejected').then((data) => {
      if (data) {
        setRejectedProjects(data as unknown as Project);
      }
    });
    supabase.from('profiles').select('*').eq('role', "agency").then((data) => {
      if (data.data) {
        setTotalAgencies(data.data.length);
      }
    });
  
  }, []);
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
       <SmallCard count={0} image='/svg/admin-pending-project.svg' title='Pending Requests'/>
        <SmallCard count={0} image='/svg/admin-approved.svg' title='Approved Projects'/>
        <SmallCard count={0} image='/svg/admin-total.svg' title='Total Agencies'/>
        <SmallCard count={0} image='/svg/admin-rejcted.svg' title='Rejected Project'/>
    </div>
  )
}

export default CardsSection