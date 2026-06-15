import SectionHeader from "@/components/common/section-header";
import { CalendarIcon, RocketIcon } from "lucide-react";

import ProductCard from "@/components/products/product-card";
import EmptyState from "@/components/common/empyt-state";
import { getRecentlyLaunchedProducts } from "@/lib/products/product-select";

// const recentlyLaucnhedProducts = [
//     {
//         id: 1,
//         name: "ParityKit",
//         description: "A  toolkit for creating parity products",
//         tags: ["UI Kit", "Figma", "Design System"],
//         votes: 650,
//         isFeatured: true
//     },
//     {
//         id: 2,
//         name: "Modern Next js course",
//         description: "Learn how to build modern web applications with next js",
//         tags: ["Course", "Next js", "Web Development"],
//         votes: 520,
//         isFeatured: true
//     }

// ];
export default async function RecentlyLaunchedProducts() {
  const recentlyLaucnhedProducts = await getRecentlyLaunchedProducts();
  return (
    <section className="py-20">
      <div className="wrapper">
        <SectionHeader
          title="Recently Launched"
          icon={RocketIcon}
          description="The most recently launced products from our community"
        />
        {recentlyLaucnhedProducts.length > 0 ? (
          <div className="grid-wrapper">
            {recentlyLaucnhedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="No Product launch in the last week. Check back soon!!"
            icon={CalendarIcon}
          />
        )}
      </div>
    </section>
  );
}
