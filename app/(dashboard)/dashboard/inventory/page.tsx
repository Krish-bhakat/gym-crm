import { db } from "@/lib/db";
import { auth } from "@/auth";
import { InventoryManager } from "./inventory-manager";

export default async function InventoryPage() {
  const session = await auth();
  
  // 🔍 DEBUG LOGS (Check your VS Code Terminal)
  const sessionGymId = (session?.user as any)?.gymId;
  console.log("--- DEBUGGING PRODUCTS PAGE ---");
  console.log("1. Logged in User:", session?.user?.email);
  console.log("2. Session Gym ID:", sessionGymId, "Type:", typeof sessionGymId);

  // Parse Gym ID safely
  const parsedGymId = Number(sessionGymId);
  console.log("3. Searching for Gym ID:", parsedGymId);

  if (!parsedGymId || isNaN(parsedGymId)) {
    console.error("❌ ERROR: Invalid Gym ID. Cannot fetch products.");
    return <div>Error: Could not find your Gym ID. Please logout and login again.</div>;
  }

  const rawProducts = await db.product.findMany({
    where: {
      // Ensure this matches your Schema (Int or String)
      gymId: parsedGymId, 
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`4. Found ${rawProducts.length} products in DB.`);

  // Convert Decimal to Number for the UI
  const products = rawProducts.map((product) => ({
    ...product,
    price: product.price.toNumber(),
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <InventoryManager initialProducts={products} />
    </div>
  );
}