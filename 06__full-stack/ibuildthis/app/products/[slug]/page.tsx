"use cache";

import SectionHeader from "@/components/common/section-header";
import VotingButtons from "@/components/products/voting-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getFeaturedProducts,
  getProductBySlug,
} from "@/lib/products/product-select";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ExternalLinkIcon,
  StarIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const generateStaticParams = async () => {
  const products = await getFeaturedProducts();
  return products.map((product) => ({
    slug: product.slug.toString(),
  }));
};

export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const { name, description, websiteUrl, tags, voteCount, tagline } = product;

  return (
    <div className="py-16">
      <div className="wrapper">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" /> Back to Explore
        </Link>

        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3 mb-12">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="mb-6">
                  <SectionHeader
                    title={name}
                    icon={StarIcon}
                    description={tagline ?? ""}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="dark:prose-invert max-w-none prose prose-neutral">
              <h2 className="mb-4 font-semibold text-xl">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            <div className="bg-primary/10 p-6 border rounded-lg">
              <h2 className="mb-4 font-semibold text-lg">Product Details</h2>

              <div className="space-y-3">
                {[
                  {
                    label: "Launched:",
                    value: new Date(
                      product.createdAt?.toISOString() ?? ""
                    ).toLocaleDateString(),
                    icon: CalendarIcon,
                  },
                  {
                    label: "Submitted by:",
                    value: product.submittedBy,
                    icon: UserIcon,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    {Icon && <Icon className="size-4 text-muted-foreground" />}
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="top-24 sticky space-y-4">
              <div className="bg-background p-6 border rounded-lg">
                <div className="mb-6 text-center">
                  <p className="mb-2 text-muted-foreground text-sm">
                    Support this product
                  </p>
                  <VotingButtons productId={product.id} voteCount={voteCount} />
                </div>
                {voteCount > 100 && (
                  <div className="pt-6 border-t">
                    <Badge className="justify-center py-2 w-full">
                      🔥 Featured Product
                    </Badge>
                  </div>
                )}
              </div>
              {websiteUrl && (
                <Button
                  asChild
                  className="rounded-lg w-full"
                  variant={"outline"}
                >
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Website <ExternalLinkIcon className="ml-2 size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}