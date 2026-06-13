import CartItem from "#/components/base/shop/cart/cart-item";
import { Button } from "#/components/ui/button";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Separator } from "#/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "#/components/ui/sheet";
import { useCartStore } from "#/lib/store/cart-store";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

export default function CartSheet() {
  const { items, isOpen, setIsOpen, totalItems, subtotal } = useCartStore();
  //   const {
  //     items,
  //     totalItems,
  //     subtotal,
  //     isLoading,
  //     updateQuantity,
  //     removeItem,
  //     isUpdating,
  //     isRemoving,
  //   } = useCart();
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full @xl:max-w-lg">
        <SheetHeader>
          <SheetTitle>Cart ({totalItems} )</SheetTitle>
        </SheetHeader>
        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem key={item.id}  />
                ))}
              </div>
            </ScrollArea>
            <div className="space-y-4 py-6">
              <Separator />
              <div className="space-y-1.5 px-6">
                <div className="flex justify-between font-medium text-base">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground text-2xl">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Shipping and taxes calculated at checkout.
                </p>
              </div>
              <div className="gap-3 grid px-6">
                <Link to="/cart" onClick={() => setIsOpen(false)}>
                <Button className="w-full" size={'lg'}>View cart</Button>
                </Link>
                <Button variant={'outline'} className="w-full" size={'lg'} onClick={() => setIsOpen(false)}>
                    Continue Shopping
                </Button>
              </div>
            </div>
          </>
        ) : (
       <div className="flex flex-col justify-center items-center space-y-2 h-full">
        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        <span className="font-medium text-muted-foreground text-lg">
            Your cart is empty
        </span>
        <Button variant={'link'} onClick={() => setIsOpen(false)}>Start Shopping</Button>
       </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
