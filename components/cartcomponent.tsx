"use client"

import { useState } from "react" // 1. Import useState
import { useRouter } from "next/navigation" // 2. Import useRouter
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
// Adjust this import path to match your project structure exactly
import { useProductStore } from "../app/(dashboard)/dashboard/(inventory)/products/store";

export function ShoppingCartSheet() {
  const { cart, removeFromCart, updateQuantity } = useProductStore();
  const router = useRouter(); // 3. Initialize router
  const [open, setOpen] = useState(false); // 4. State to control sheet visibility
  
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const handleCheckout = () => {
    setOpen(false); // Close the side sheet
    router.push("/checkout"); // Navigate to the page
  }

  return (
    // 5. Bind the open state here
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cart.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        
        <Separator className="my-4" />

        <ScrollArea className="flex-1 -mx-6 px-6">
          {cart.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
               <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
               <p>Your cart is empty</p>
             </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 rounded-lg bg-muted border overflow-hidden shrink-0">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  
                  <div className="flex flex-col flex-1 justify-between">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                      <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border rounded-md h-8">
                        <Button 
                            variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-md"
                            onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-xs">{item.quantity}</span>
                        <Button 
                            variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-r-md"
                            onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <SheetFooter>
            {/* 6. Attach the handleCheckout function */}
            <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={handleCheckout}>
                Proceed to Checkout
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}