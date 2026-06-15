"use cache";
import SectionHeader from "@/components/common/section-header";
import { ArrowUpRightIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProductCard from "@/components/products/product-card";
import { getFeaturedProducts } from "@/lib/products/product-select";

// const featuredProducts = [
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

export default async function FeaturedProducts() {
  const featuredProducts = await getFeaturedProducts();
  return (
    <section className="bg-muted/20 py-20">
      <div className="wrapper">
        <div className="flex justify-between items-center mb-8">
          <SectionHeader
            title="Featured Today"
            icon={StarIcon}
            description="Top picks from our community this week"
          />
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/explore">
              View All <ArrowUpRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid-wrapper">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
