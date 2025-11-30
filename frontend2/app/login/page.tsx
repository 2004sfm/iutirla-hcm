import { LoginForm } from "@/components/login-form"
import { IutirlaLogo } from "@/components/iutirla-logo"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 justify-center lg:justify-normal">
        <div className="flex justify-center gap-2 lg:justify-start">
          <IutirlaLogo />
        </div>
        <div className="flex items-center justify-center lg:flex-1">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/images/iutirla-porlamar.webp"
          alt="Imagen IUTIRLA porlamar"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
