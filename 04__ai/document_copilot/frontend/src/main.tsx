import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TooltipProvider } from './components/ui/tooltip.tsx'
import { Toaster } from './components/ui/sonner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <TooltipProvider>
      <App />
      <Toaster position="top-center" richColors />
    </TooltipProvider>
  </StrictMode>,
)
