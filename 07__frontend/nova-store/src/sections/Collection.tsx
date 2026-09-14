import { products } from '../data/products'

export function Collection() {
  return (
    <section className="space-y-12">
      <div className="text-center">
        <h2 className="text-white">The NOVA collection.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-800 rounded p-6 hover:border-gray-600 transition-colors group cursor-pointer"
          >
            <div className="h-64 bg-gradient-to-br from-gray-900 to-black rounded mb-6 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm">[Product Model]</p>
              </div>
            </div>
            <h3 className="text-white font-light text-lg mb-2">{product.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{product.category}</p>
            <p className="text-gray-400 text-sm mb-4">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-white font-light">${product.price}</span>
              <span className="text-gray-600 text-xs">{product.accent}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
