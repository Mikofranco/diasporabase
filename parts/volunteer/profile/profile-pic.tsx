import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React from 'react'

const ProfilePictureSection = () => {
  return (
    <div>
        Profile Picture Section
        <Image src={""} width={200} height={200} alt=''/>

        <Button>Change Picture</Button>
    </div>
  )
}

export default ProfilePictureSection