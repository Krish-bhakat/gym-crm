"use client"

import { useState, useTransition } from "react"
import  {registerUser}  from "@/app/(auth)/signup/actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { Loader2, Dumbbell } from "lucide-react" 

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    const formData = new FormData(event.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match!")
      return
    }

    startTransition(() => {
      registerUser(formData)
        .then((data) => {
          if (data?.error) setError(data.error)
          if (data?.success) setSuccess(data.success)
        })
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Register your Gym</CardTitle>
          <CardDescription>
            Create a new gym workspace and admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              
              {/* --- NEW FIELD: Gym Name --- */}
              <Field>
                <FieldLabel htmlFor="gymName" className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" /> Gym Name
                </FieldLabel>
                <Input 
                  id="gymName" 
                  name="gymName" 
                  type="text" 
                  placeholder="e.g. Iron Pump Fitness" 
                  required 
                  disabled={isPending}
                />
              </Field>
              {/* --------------------------- */}

              <Field>
                <FieldLabel htmlFor="name">Admin Full Name</FieldLabel>
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  disabled={isPending}
                />
              </Field>
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
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      disabled={isPending}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input 
                      id="confirm-password" 
                      name="confirm-password" 
                      type="password" 
                      required 
                      disabled={isPending}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>

              {error && (
                <div className="bg-destructive/15 p-3 rounded-md text-sm text-destructive">
                   {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/15 p-3 rounded-md text-sm text-emerald-500">
                   {success}
                </div>
              )}

              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Create Gym Workspace"}
                </Button>
                <FieldDescription className="text-center mt-2">
                  Already have an account? <a href="/login" className="underline">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#" className="underline">Terms of Service</a>{" "}
        and <a href="#" className="underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}