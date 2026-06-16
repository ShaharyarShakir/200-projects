<script lang="ts">
  import { onMount } from "svelte";

  type Product = {
    _id?: string;
    name: string;
    description: string;
    price: number;
    filename?: string;
  };

  let products: Product[] = [];

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(value);

  onMount(async () => {
    try {
      const res = await fetch("http://localhost:4000/api/products");
      if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
      const data = await res.json();
      products = data.products ?? [];
      console.log(products);
    } catch (err) {
      console.error(err);
    }
  });
</script>

<section class="max-w-[1100px] mx-auto p-6">
  <div class="mb-4 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Products</h1>
    <a
      href="/create"
      class="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white font-semibold px-3 py-2 hover:bg-gray-800"
      >Create product</a
    >
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each products as p (p._id)}
      <article
        class="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-transform duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-lg"
      >
        <img
          class="w-full aspect-3/2 object-cover bg-gray-100"
          src={`https://d11u5f6m3yi74y.cloudfront.net/${p.filename}`}
          alt={p.name}
          loading="lazy"
        />
        <div class="p-4 space-y-2">
          <h2 class="text-lg font-semibold leading-snug">{p.name}</h2>
          <p class="text-gray-600 text-sm leading-relaxed">{p.description}</p>
          <div class="mt-1 flex items-center justify-between gap-3">
            <span class="font-bold text-gray-900">{formatPrice(p.price)}</span>
            <button
              class="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white font-semibold px-3 py-2 hover:bg-gray-800"
              type="button"
            >
              Add to cart
            </button>
          </div>
        </div>
      </article>
    {/each}
  </div>
</section>
