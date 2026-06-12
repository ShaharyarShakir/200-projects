import { Link } from '@tanstack/react-router'
import Navbar from './navbar'
import { Button } from '#/components/ui/button'
import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { ModeToggle } from '../provider/modal-toggle'

const navigationItems = [
  {to: '/', label: 'Home'},
  {to: '/product', label: 'Products'},
  {to: '/category',label: 'Category'}
]

export default function Header() {
  const [isCardOpen, setIsCardOpen] = useState(false)
  return (
    <header className='@container top-0 z-40 sticky bg-background backdrop-blur supports-filter-bg-background/80 border-b border-dashed w-full'>
      <div className='grid grid-cols-2 @6xl:grid-cols-3 mx-auto px-4 py-7 container'>
        <Navbar items={navigationItems} />
        <div className="flex justify-start @6xl:justify-center items-center">
          <Link to='/'  className='font-bold dark:text-white text-xl @6xl:text-4xl tracking-tight'>
          Shop 
          <span className='text-primary text-4xl'>-</span>
          Stack
          </Link>
        </div>
        <div className="flex justify-end items-center gap-2">
          <div className="hidden @6xl:flex items-center gap-2">
            <Button variant={'outline'} size={'icon-lg'} type='button' aria-label='open cart' onClick={() => setIsCardOpen(true)} 
            className='relative'>
              <ShoppingBag className='size-5 @7xl:size-6' />
              <span className='-top-1 right-1 absolute flex justify-center items-center bg-primary rounded-full w-5 h-5 font-medium text-[10px] text-primary-foreground'>
10
              </span>
              </Button>
              <ModeToggle />
              {/* (user ? <Button>Account</Button> : <Button>Login</Button>) */}
              <Link to='/auth/sign-in'>
              <Button variant={'default'} size={'lg'} type='button'>Sign in</Button>
              </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
