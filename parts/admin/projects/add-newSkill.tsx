import { createClient } from '@/lib/supabase/client'
import { getUserId } from '@/lib/utils'
import { useParams } from 'next/navigation'
import React, { useEffect } from 'react'

const supabase = createClient()

const AddProjectSkill = () => {
    const projectId = useParams()

    useEffect(()=>{
        const addRequiredSkill = async()=>{
            const userId = await getUserId()
            if(!userId) return
            const {data, error} = await supabase.from('projects').update({
                required_skills: supabase.rpc('add_to_array', {
                    original_array: supabase.select('required_skills').eq('id', projectId).single(),
                    new_element: 'New Skill' // Replace with actual skill to add
                })
            }).eq('id', projectId)
            if(error) console.log('Error adding skill:', error)
            else console.log('Skill added successfully:', data)
        }
    },[])

  return (
    <div>

    </div>
  )
}

export default AddProjectSkill