import { Navbar } from './components/layout/Navbar'
import { Hero } from './sections/Hero'
import { ProductStory } from './sections/ProductStory'
import { Collection } from './sections/Collection'
import { Customize } from './sections/Customize'
import { CTA } from './sections/CTA'

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <ProductStory />
      <Collection />
      <Customize />
      <CTA />
    </div>
  )
}

export default App
