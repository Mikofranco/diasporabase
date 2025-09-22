import React from 'react'
import RequestSlate from './request-slate'

const AgencyRequestFromVolunteer = () => {
  return (
    <div className='bg-white p-6 rounded-lg shadow-md space-y-4 mt-8'>
         <h2 className="font-semibold text-xl">Volunteer requests</h2>
        <RequestSlate applicantName='Chisom Joy' onAccept={()=>""} onDecline={()=>""} projectTitle='Farming Activites'/>
        <RequestSlate applicantName='Nuel Blessing' onAccept={()=>""} onDecline={()=>""} projectTitle='Technology Advancements'/>
    </div>
  )
}

export default AgencyRequestFromVolunteer