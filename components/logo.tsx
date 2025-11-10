import Image from 'next/image'
import React from 'react'

const Logo = () => {
  return (
    <div className='flex w-fit items-center mx-auto p-2 gap-2'>
        <Image src="/svg/logo.svg" alt='Logo' height={30} width={30}/>
        <h2 className='text-xl md:text-2xl text-[#0284c7] font-semibold'>DiasporaBase</h2>
    </div>
  )
}

export default Logo