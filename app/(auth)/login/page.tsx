import { Suspense } from "react";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { googleAuthEnabled, passwordAuthEnabled } from "@/lib/auth";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm googleEnabled={googleAuthEnabled} passwordEnabled={passwordAuthEnabled} />
    </Suspense>
  );
}
