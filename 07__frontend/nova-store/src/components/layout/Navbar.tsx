import { useState } from 'react'
import { Menu, X, ShoppingCart } from 'lucide-react'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-lg font-light tracking-wider">NOVA</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Products
            </a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Collection
            </a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Customize
            </a>
          </div>

          {/* Cart & Menu Button */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-900 rounded transition-colors">
              <ShoppingCart size={20} className="text-gray-300" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-white text-black text-xs rounded-full flex items-center justify-center font-medium">
                0
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 hover:bg-gray-900 rounded transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4 space-y-3">
            <a href="#" className="block text-gray-300 hover:text-white text-sm py-2">
              Products
            </a>
            <a href="#" className="block text-gray-300 hover:text-white text-sm py-2">
              Collection
            </a>
            <a href="#" className="block text-gray-300 hover:text-white text-sm py-2">
              Customize
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}
