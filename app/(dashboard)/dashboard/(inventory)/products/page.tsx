import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProductList } from "@/components/product_list"; // Update path if needed

export default async function ProductsPage() {
  const session = await auth();
  
  // 1. Fetch from Database
  const rawProducts = await db.product.findMany({
    where: {
      gymId: Number((session?.user as any).gymId),
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Format for Client (Convert Decimal to Number)
  const products = rawProducts.map((p) => ({
    ...p,
    id: p.id,
    title: p.name, // Map 'name' to 'title' if your UI expects title
    name: p.name,
    price: p.price.toNumber(),
    // Add default values for fields that might be missing in DB but needed in UI
    image: "https://placehold.co/600x600?text=Product", 
    rating: 5.0,
    reviews: 0,
    flavors: [] 
  }));

  return (
    <div className="h-full w-full p-4">
      {/* 3. Pass Data to Client Component */}
      <ProductList initialData={products} />
    </div>
  );
}