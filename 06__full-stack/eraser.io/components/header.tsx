
// import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs'
import Image from 'next/image'
import React from 'react'

function Header() {
  return (
    <header className="bg-black">
  <div className="flex items-center gap-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl h-16">
    <Image src='/logo.svg' alt='logo'
    width={100}
    height={100}
    />

    <div className="flex flex-1 justify-end md:justify-between items-center">
      <nav aria-label="Global" className="hidden md:block">
        <ul className="flex items-center gap-6 text-sm">
          <li>
            <a className="text-white hover:text-gray-100 transition" href="#"> About </a>
          </li>

          <li>
            <a className="text-white hover:text-gray-100/75 transition" href="#"> Careers </a>
          </li>

          <li>
            <a className="text-white hover:text-gray-100/75 transition" href="#"> History </a>
          </li>

          <li>
            <a className="text-white hover:text-gray-100/75 transition" href="#"> Services </a>
          </li>

          <li>
            <a className="text-white hover:text-gray-100/75 transition" href="#"> Projects </a>
          </li>

        
        </ul>
      </nav>

      <div className="flex items-center gap-4">
        <div className="sm:flex sm:gap-4">
          <div
            className="block px-5 py-2.5 rounded-md font-medium text-white text-sm transition"
           
          >
            {/* <LoginLink postLoginRedirectURL="/dashboard"> Login</LoginLink> */}
          </div>

          <div
            className="hidden sm:block bg-gray-100 px-5 py-2.5 rounded-md font-medium text-black hover:text-slate-800 text-sm transition"
           
          >
          {/* <RegisterLink>Register</RegisterLink>   */}
          </div>
        </div>

        <button
          className="md:hidden block bg-gray-100 p-2.5 rounded text-gray-600 hover:text-gray-600/75 transition"
        >
          <span className="sr-only">Toggle menu</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>
  )
}

export default Header