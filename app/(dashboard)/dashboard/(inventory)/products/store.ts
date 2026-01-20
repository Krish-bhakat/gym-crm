import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  id: number;
  title: string; // The UI expects 'title', mapped from 'name' in page.tsx
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  brand: string;
  image: string;
  isNew: boolean;
  category: string;
  flavors: string[];
  weight: string;
  inStock: boolean;
  stock?: number; // Added optional stock field
}

export interface CartItem extends Product {
  quantity: number;
}

export type NewProductInput = Omit<Product, "id">;

interface ProductStore {
  // Inventory State
  products: Product[];
  filteredProducts: Product[];
  
  // Cart State
  cart: CartItem[];

  // Filter State
  searchQuery: string;
  viewMode: string;
  selectedCategory: string;

  // Actions
  setProducts: (products: any[]) => void; // ✅ ADDED THIS
  addProduct: (product: NewProductInput) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: string) => void;
  setSelectedCategory: (category: string) => void;
  searchProducts: () => void;
  
  // Cart Actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  clearCart: () => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      // ✅ Start with empty arrays (we will fill them from DB on mount)
      products: [], 
      filteredProducts: [],
      cart: [], 
      searchQuery: "",
      viewMode: "grid",
      selectedCategory: "all",

      // ✅ ADDED THIS ACTION
      setProducts: (incomingProducts) => {
        set({ 
          products: incomingProducts, 
          filteredProducts: incomingProducts // Reset list with new data
        });
      },

      // --- INVENTORY ACTIONS ---
      addProduct: (newProductData) => {
        // Note: This adds to client state only. 
        // Ideally, you should reload the page or fetch from server after adding.
        const { products } = get();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        // @ts-ignore
        const newProduct: Product = { ...newProductData, id: newId };
        const updated = [newProduct, ...products];
        set({ products: updated });
        get().searchProducts();
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().searchProducts();
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
        get().searchProducts();
      },

      searchProducts: () => {
        const { products, searchQuery, selectedCategory } = get();
        let filtered = products;

        if (selectedCategory !== "all") {
          // Ensure we handle both casing matches just in case
          filtered = filtered.filter(p => 
            p.category?.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.brand.toLowerCase().includes(query)
          );
        }
        set({ filteredProducts: filtered });
      },

      // --- CART ACTIONS ---
      addToCart: (product) => {
        const { cart } = get();
        const existingItem = cart.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            cart: cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { ...product, quantity: 1 }] });
        }
      },

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((item) => item.id !== productId) });
      },

      updateQuantity: (productId, delta) => {
        const { cart } = get();
        const updatedCart = cart.map((item) => {
          if (item.id === productId) {
            const newQuantity = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        }).filter(item => item.quantity > 0);

        set({ cart: updatedCart });
      },

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "gym-store-storage", 
    }
  )
);