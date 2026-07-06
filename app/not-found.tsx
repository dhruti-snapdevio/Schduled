import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-5xl font-bold text-foreground">404</p>
      <p className="mt-3 text-base text-muted-foreground">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        Go home
      </Link>
    </div>
  );
}