import { Button } from '../components/ui/Button'

export function Customize() {
  return (
    <section className="bg-gray-950 space-y-8 text-center">
      <h2 className="text-white">Make it yours.</h2>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">
        Every NOVA object can be tailored to your needs. Choose materials, colors, and configurations
        that reflect your vision.
      </p>
      <Button variant="secondary">
        Start customizing
      </Button>
    </section>
  )
}
