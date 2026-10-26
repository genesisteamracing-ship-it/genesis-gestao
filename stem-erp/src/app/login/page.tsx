import { redirect } from "next/navigation";
import { getCurrentUserFromSession } from "@/services/auth-service";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUserFromSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6FA] p-4 sm:p-6">
      <LoginForm />
    </main>
  );
}
