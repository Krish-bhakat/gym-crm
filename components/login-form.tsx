"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { login } from "@/app/(auth)/login/actions" // <--- IMPORT THIS
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()

  // --- THIS FUNCTION WAS MISSING IN YOUR CODE ---
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault() // <--- THIS LINE STOPS THE PAGE RELOAD
    setError("")

    const formData = new FormData(event.currentTarget)

    startTransition(() => {
      login(formData)
        .then((data) => {
          if (data?.error) {
            setError(data.error)
          }
        })
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {/* --- CRITICAL FIX IS HERE: ADD onSubmit={handleSubmit} --- */}
          <form onSubmit={handleSubmit}>
            
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isPending}
                />
              </Field>
              <Field className="mt-4">
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a href="#" className="ml-auto text-sm hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  name="password" 
                  disabled={isPending} 
                  required 
                />
              </Field>
              
              <Field>
                {error && (
                  <div className="bg-destructive/15 p-3 rounded-md text-sm text-destructive mt-4 text-center">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full mt-4" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Login"}
                </Button>
                
                <FieldDescription className="text-center mt-2">
                  Don't have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}