"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db"; 
import { auth } from "@/auth";
import { ProductSchema, type ProductFormValues } from "@/lib/schema";

// ✅ 1. ADD PRODUCT
export async function addProduct(data: ProductFormValues) {
  try {
    const validated = ProductSchema.parse(data);
    const session = await auth();

    // Ensure user is logged in and has a gymId
    if (!session?.user || !(session.user as any).gymId) {
      return { error: "Unauthorized: Missing Gym ID." };
    }

    await db.product.create({
      data: {
        name: validated.name,
        price: validated.price,
        stock: validated.stock,
        description: validated.description,
        gymId: (session.user as any).gymId,
        category: validated.category // Ensure this matches your DB type
      },
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Add Error:", error);
    return { error: "Failed to add product" };
  }
}

// ✅ 2. DELETE PRODUCT (Strictly Number)
export async function deleteProduct(productId: number) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    console.log("Deleting Product ID:", productId); // Debug Log

    await db.product.delete({
      where: { id: productId }, // No String() conversion!
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    // Handle "Record not found" gracefully
    if ((error as any).code === "P2025") {
      console.warn("Product already deleted.");
      return { success: true }; // Treat as success since it's gone
    }
    console.error("Delete Error:", error);
    return { error: "Failed to delete product" };
  }
}