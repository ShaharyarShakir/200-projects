"use cache";
import SectionHeader from "@/components/common/section-header";
import { ArrowUpRightIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProductCard from "@/components/products/product-card";
import { getFeaturedProducts } from "@/lib/products/product-select";

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