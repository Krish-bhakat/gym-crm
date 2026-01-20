"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Package } from "lucide-react";
import { ProductSchema, type ProductFormValues } from "@/lib/schema";
import { addProduct, deleteProduct } from "./crud";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ✅ Import Textarea for the description
import { Textarea } from "@/components/ui/textarea"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define the shape of the Product coming from the DB
interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  category: string | null; // Allow null since it might be optional in DB
  description: string | null;
}

export function InventoryManager({ initialProducts, isReadOnly= false }: { initialProducts: Product[], isReadOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  
  // --- ADD FORM SETUP ---
  const form = useForm({
    resolver: zodResolver(ProductSchema),
    defaultValues: { 
      name: "", 
      category: "", // ✅ Initialize Category
      price: 0, 
      stock: 0, 
      description: "" // ✅ Initialize Description
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    const res = await addProduct(data);
    if (res.success) {
      setOpen(false);
      form.reset();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Stock Management</h2>
        {!isReadOnly && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add New Stock</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Row 1: Name & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Whey Protein" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  {/* ✅ NEW: Category Field */}
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        {/* You can change this to a Select later if you have fixed categories */}
                        <Input placeholder="e.g. Supplements" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Row 2: Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value as number} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Qty</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value as number} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* ✅ NEW: Description Field */}
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Product details..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                  Save Stock
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Inventory Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead> 
              <TableHead>Price</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No products found. Add one above!
                </TableCell>
              </TableRow>
            ) : (
              initialProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div>{product.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {product.description}
                    </div>
                  </TableCell>
                  <TableCell>{product.category || "Uncategorized"}</TableCell> {/* ✅ Display Category */}
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {product.stock}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteButton productId={product.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ... DeleteButton remains the same ...
function DeleteButton({ productId }: { productId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteProduct(productId);
      if (!res.success) alert(res.error);
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Item?</AlertDialogTitle>
          <AlertDialogDescription>This will remove the product from your inventory permanently.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => { e.preventDefault(); handleDelete(); }} 
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}