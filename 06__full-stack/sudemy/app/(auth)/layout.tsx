import React, { ReactNode } from 'react'

export default function AuthLayout({children}:{children: ReactNode}) {
  return (
    <div className='flex flex-col w-full max-w-sm'>
      {children}
    </div>
  )
}
