import LeftSide from '@/components/layout/left-side'
import Navbar from '@/components/layout/navbar'
import React from 'react'

export default function CoreLayout({children}: {children: React.ReactNode}) {
  return (
    <>
    <Navbar />
    <div className='flex gap-8 mx-auto mx-w-[1200px] px-4 pt-2 pb-16'>
        <LeftSide />
        <div className='flex-1 min-w-0'>{children}</div>
    </div>
    </>
  )
}
