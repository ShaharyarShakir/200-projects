import React from 'react'
import './index.css'
import { Route, Router, Routes } from 'react-router-dom'
import Home from "./pages/Home"
import Projects from "./pages/Projects"
import Agence from "./pages/Agence"
export default function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/agence' element={<Agence />} />
      </Routes>
    </div>
  )
}
