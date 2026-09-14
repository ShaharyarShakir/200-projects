import { Button } from '../components/ui/Button'

export function CTA() {
  return (
    <section className="min-h-96 flex flex-col items-center justify-center text-center space-y-8">
      <h2 className="text-white">Find your next object.</h2>
      <p className="text-gray-400 text-lg max-w-2xl">
        Join a community of people who believe in intentional design and craftsmanship.
      </p>
      <div className="flex gap-4">
        <Button variant="primary">
          Browse collection
        </Button>
        <Button variant="secondary">
          Learn more
        </Button>
      </div>
    </section>
  )
}
