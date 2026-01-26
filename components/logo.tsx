"use client"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'

const Logo = () => {
  const router = useRouter();
  return (
    <div className='flex w-fit items-center mx-auto p-2 gap-2 cursor-pointer' onClick={()=>router.push("/")}>
        <Image src="/svg/logo.svg" alt='Logo' height={30} width={30}/>
        <h2 className='text-xl md:text-2xl text-[#0284c7] font-semibold'>DiasporaBase</h2>
    </div>
  )
}

export default Logo