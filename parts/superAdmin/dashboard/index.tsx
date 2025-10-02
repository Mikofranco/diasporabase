"use client"
import React from 'react'
import CardsSection from './cardsSection'

const AdminDashBoard = () => {
  return (
    <div className='space-y-6 p-4 bg-white rounded-lg shadow-sm'>
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">Welcome to Admin Dashboard</h3>
        <p className="text-sm text-muted-foreground">Manage projects, volunteers, and agencies.</p>
      </div>
       <CardsSection/>

        
    </div>
  )
}

export default AdminDashBoard