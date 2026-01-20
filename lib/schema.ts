// lib/schemas.ts
import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be positive"),
  description: z.string().optional(),
  dateofbirth: z.coerce.date().optional()
});

export type ProductFormValues = z.infer<typeof ProductSchema>;