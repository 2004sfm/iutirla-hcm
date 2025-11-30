"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  username: z.string().min(1, {
    message: "El usuario es requerido.",
  }),
  password: z.string().min(1, {
    message: "La contraseña es requerida.",
  }),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsLoading(true);

    try {
      await login(values.username, values.password);
    } catch (err: any) {
      // console.error("Login error:", err);
      if (err.response) {
        if (err.response.status === 400) {
          // Field validation errors
          const data = err.response.data;
          if (data.non_field_errors) {
            setError(data.non_field_errors[0]);
          } else if (data.detail) {
            setError(data.detail);
          } else {
            // Set field errors in react-hook-form
            Object.keys(data).forEach((key) => {
              if (key === "username" || key === "password") {
                form.setError(key as "username" | "password", {
                  type: "manual",
                  message: data[key][0],
                });
              }
            });
          }
        } else if (err.response.status === 401) {
          const data = err.response.data;
          setError(data.detail || "Credenciales inválidas. Por favor verifique su usuario y contraseña.");
        } else {
          setError("Ocurrió un error al iniciar sesión. Intente nuevamente.");
        }
      } else {
        setError("Error de conexión. Verifique su internet.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Ingrese sus credenciales
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full bg-brand-primary hover:bg-brand-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </div>

          <div className="flex justify-end">
            <Link href="#" className="text-sm text-end underline-offset-4 hover:underline hover:text-primary">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}

