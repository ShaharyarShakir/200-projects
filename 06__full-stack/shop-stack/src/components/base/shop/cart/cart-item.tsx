import { Loader2, Trash2 } from "lucide-react";
import { QuantitySelector } from "../../products/details/quantity-selector"
import { Button } from "#/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { CartItemResponse } from "#/types/cart";

interface CartItemProps {
  item: CartItemResponse;
  isCompact?: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export default function CartItem({
  item,
  isCompact = false,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}: CartItemProps) {
  const hasVariants =
    item.variantOptions && Object.keys(item.variantOptions).length > 0;
  const variantText = hasVariants
    ? Object.entries(item.variantOptions!)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" | ")
    : null;

  return (
    <div
      className={`flex gap-4 py-4 ${isCompact ? "items-start" : "items-center"} ${
        isRemoving ? "opacity-50" : ""
      }`}
    >
      <Link
        to="/product/$productId"
        params={{ productId: item.slug }}
        className={`relative overflow-hidden rounded-md border bg-muted ${
          isCompact ? "h-20 w-20" : "h-24 w-24"
        }`}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full text-muted-foreground">
            No Image
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 justify-between gap-2">
        <div className="flex justify-between gap-2">
          <div className="space-y-1">
            <Link
              to="/product/$productId"
              params={{ productId: item.slug }}
              className="font-medium hover:underline leading-none"
            >
              {item.name}
            </Link>
            {variantText && (
              <p className="text-muted-foreground text-sm">{variantText}</p>
            )}
            <p className="text-muted-foreground text-xs">{item.shopName}</p>
          </div>
          {!isCompact && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-destructive hover:text-destructive/90"
              onClick={() => onRemove(item.id)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="sr-only">Remove item</span>
            </Button>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="font-semibold">${item.price.toFixed(2)}</p>
            {item.regularPrice && item.regularPrice > item.price && (
              <p className="text-muted-foreground text-sm line-through">
                ${item.regularPrice.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <QuantitySelector
                value={item.quantity}
                onChange={(value) => onUpdateQuantity(item.id, value)}
                max={item.maxQuantity}
                className="@7xl:h-9"
                size="sm"
                disabled={isUpdating}
              />
              {isCompact && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 w-8 h-8 text-destructive hover:text-destructive/90"
                  onClick={() => onRemove(item.id)}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="sr-only">Remove item</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}