'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { login } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      await login(data.username, data.password);
    } catch (error) {
      if (error instanceof AxiosError) {

        // --- 1. CAPTURAMOS LOS ERRORES DE CREDENCIALES (400 y 401) ---
        if (error.response?.status === 401 || error.response?.status === 400) {

          // Intenta extraer el mensaje detallado de Django
          let errorMessage = "Usuario o contraseña incorrectos.";

          // Paquetes como Simple JWT o DRF a menudo envían errores de credenciales 
          // en la propiedad 'detail' del cuerpo de la respuesta (data).
          const detailMessage = error.response?.data?.detail;

          if (detailMessage && typeof detailMessage === 'string') {
            // Usamos el mensaje específico del backend si existe.
            errorMessage = detailMessage;
          }

          setGlobalError(errorMessage);

        } else if (error.code === "ERR_NETWORK") {
          // --- 2. ERROR DE CONEXIÓN ---
          setGlobalError("No se pudo conectar con el servidor. Verifique su conexión o si el backend está activo.");
        } else {
          // --- 3. OTROS ERRORES (500, etc.) ---
          // Para el usuario común, no mostramos el 500.
          setGlobalError("Ocurrió un error inesperado. Póngase en contacto con soporte técnico.");
          console.error(`Error del servidor ${error.response?.status || "Desconocido"}:`, error);
        }
      } else {
        // Errores que no son de Axios
        console.error("Error inesperado:", error);
        setGlobalError("Ocurrió un error inesperado. Intente nuevamente.");
      }
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Acceder a tu cuenta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        {globalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de Acceso</AlertTitle>
            <AlertDescription>
              {globalError}
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="username">Nombre de usuario</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="ej: bcontreras"
            className={errors.username ? "border-destructive focus-visible:ring-destructive" : ""}
            {...register("username")}
          />
          {errors.username && (
            <p className="text-destructive text-xs mt-1">{errors.username.message}</p>
          )}
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Link
              href="#"
              className="text-sm underline-offset-4 hover:underline text-muted-foreground text-end"
              tabIndex={-1}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="********"
            className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
          )}
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}