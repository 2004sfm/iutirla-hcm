import { Card, CardContent } from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"
import { IutirlaLogo } from "@/components/iutirla-logo"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 justify-center items-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex justify-center gap-2 mb-6">
              <IutirlaLogo />
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full">
                <LoginForm />
              </div>
            </div>
          </CardContent>
        </Card>
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
