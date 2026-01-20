"use client";

import { useEffect, useState } from "react";
import {
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconFilter,
  IconShoppingCart,
  IconStarFilled,
  IconScale
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCartSheet } from "@/components/cartcomponent"; 

import { useProductStore } from "../app/(dashboard)/dashboard/(inventory)/products/store";

const categories = [
  { id: "all", label: "All Products" },
  { id: "protein", label: "Whey Protein" },
  { id: "creatine", label: "Creatine" },
  { id: "pre-workout", label: "Pre-Workout" },
  { id: "vitamins", label: "Vitamins" },
  { id: "gear", label: "Gym Gear" },
];

// ✅ Accept real data from the Server Page
export function ProductList({ initialData = [] }: { initialData?: any[] }) {
  const {
    filteredProducts,
    searchQuery,
    viewMode,
    selectedCategory,
    setSearchQuery,
    setViewMode,
    setSelectedCategory,
    addToCart,
    setProducts, // ✅ Use the new action
    searchProducts // You might keep this for client-side filtering
  } = useProductStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ✅ SYNC: When component loads, put the Server Data into the Store
  useEffect(() => {
    if (initialData.length > 0) {
      setProducts(initialData);
    }
  }, [initialData, setProducts]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
      
      <aside className="hidden lg:block w-64 shrink-0 space-y-6">
        <FilterContent 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </aside>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-3">
          <div className="relative w-full sm:w-80">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search supplements..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
             <ShoppingCartSheet />

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <IconFilter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterContent 
                     categories={categories}
                     selectedCategory={selectedCategory}
                     onSelectCategory={setSelectedCategory}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <IconLayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <IconList className="h-4 w-4" />
              </Button>
            </div>
            
            {/* ❌ REMOVED: AddProductDialog is gone from here! */}
          </div>
        </div>

        <Separator />

        <ScrollArea className="h-[calc(100vh-200px)]">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No products found matching your search.
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-10"
                  : "flex flex-col gap-4 pb-10"
              }
            >
              {filteredProducts.map((product: any) => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode}
                    onAdd={() => addToCart(product)} 
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// ... FilterContent and ProductCard components remain exactly the same ...
// ... AddProductDialog component is deleted ...

function FilterContent({ categories, selectedCategory, onSelectCategory }: any) {
  return (
    <div className="space-y-6 mx-4.5 my-5">
      <div>
        <h3 className="text-sm font-semibold mb-3">Categories</h3>
        <div className="space-y-1">
          {categories.map((cat: any) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-sm"
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, viewMode, onAdd }: { product: any; viewMode: string, onAdd: () => void }) {
    // ... Copy your existing ProductCard code here ...
    // (I am omitting it to save space, but keep it exactly as you had it)
    // Make sure it includes the `onAdd` prop implementation we fixed earlier.
    if (viewMode === "list") {
        return (
          <div className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow bg-card">
            {/* Image handling needs to be safe if product.image is missing */}
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
               <img src={product.image || "https://placehold.co/600x600?text=No+Image"} alt={product.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold truncate">{product.name}</h3> {/* Changed title to name to match DB */}
                  <p className="text-sm text-muted-foreground">{product.brand || "Generic"}</p>
                </div>
                <span className="font-bold text-lg">${product.price}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                 <Badge variant="outline" className="text-xs capitalize">{product.category}</Badge>
                 {product.stock > 0 ? (
                    <span className="text-green-600 text-xs">In Stock ({product.stock})</span>
                 ) : (
                    <span className="text-red-500 text-xs">Out of Stock</span>
                 )}
              </div>
            </div>
             <Button size="sm" onClick={onAdd}>
                 <IconShoppingCart className="size-4" />
             </Button>
          </div>
        );
      }
    
      // Grid View
      return (
        <div className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all flex flex-col">
          <div className="aspect-square bg-muted relative flex items-center justify-center p-4">
            <img
              src={product.image || "https://placehold.co/600x600?text=No+Image"}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105 mix-blend-multiply"
            />
          </div>
    
          <div className="p-4 flex flex-col flex-1 gap-2">
            <div>
               <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
                 {product.name} {/* DB field is usually 'name' not 'title' */}
               </h3>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">${product.price}</span>
            </div>
    
            <div className="mt-auto pt-2">
               <Button className="w-full" size="sm" onClick={onAdd}>
                 <IconShoppingCart className="mr-2 size-4" /> Add to Cart
               </Button>
            </div>
          </div>
        </div>
      );
}