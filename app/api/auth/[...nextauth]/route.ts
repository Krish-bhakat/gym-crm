// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth" // Imports from the file above

export const { GET, POST } = handlers;