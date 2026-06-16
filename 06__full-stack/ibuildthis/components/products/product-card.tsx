import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StarIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import VotingButtons from "./voting-buttons";
import { ProductType } from "@/types";

export default function ProductCard({ product }: { product: ProductType }) {
  const hasVoted = false;
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group hover:bg-primary-foreground/10 border-gray-400 border-solid min-h-50 card-hover">
        <CardHeader className="flex-1">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="group-hover:text-primary text-lg transition-colors">
                  {product.name}
                </CardTitle>
                {product.voteCount > 100 && (
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <StarIcon className="fill-current size-3" />
                    Featured
                  </Badge>
                )}
              </div>
              <CardDescription>{product.description}</CardDescription>
            </div>
            {/** Voting buttons */}
            <VotingButtons
              hasVoted={hasVoted}
              voteCount={product.voteCount}
              productId={product.id}
            />
          </div>
        </CardHeader>
        <CardFooter>
          <div className="flex items-center gap-2">
            {product.tags?.map((tag) => (
              <Badge variant="secondary" key={tag}>
                {tag}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}