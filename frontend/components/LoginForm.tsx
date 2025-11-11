import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Acceder a tu cuenta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Ingresa tus credenciales para acceder
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input id="password" type="password" placeholder="********" required />
        </Field>
        <Field>
          <Button type="submit">Iniciar sesión</Button>
        </Field>
        <FieldDescription className="text-center">
          <Link
            href="#"
            className="ml-auto text-sm underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
