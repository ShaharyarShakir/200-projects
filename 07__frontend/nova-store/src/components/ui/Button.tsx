import { type ReactNode } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyles =
    'px-6 py-3 rounded text-sm font-medium transition-all duration-200 ease-out'

  const variants = {
    primary:
      'bg-white text-black hover:bg-gray-100 active:scale-95',
    secondary:
      'border border-gray-600 text-white hover:border-white active:scale-95',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
