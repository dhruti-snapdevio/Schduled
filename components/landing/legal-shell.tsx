import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";

const DARK_BG: React.CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(20,184,166,.18) 0%, transparent 55%),
    radial-gradient(circle at bottom left, rgba(13,148,136,.10) 0%, transparent 55%),
    linear-gradient(180deg, #081C1C 0%, #041010 100%)
  `,
};

export interface TocEntry {
  id: string;
  label: string;
}

interface LegalShellProps {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  toc: TocEntry[];
  children: React.ReactNode;
}

export function LegalShell({
  eyebrow,
  title,
  description,
  lastUpdated,
  toc,
  children,
}: LegalShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Logo variant="full" size="lg" href="/" />
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Started Free <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28" style={DARK_BG}>
        {/* Glow orb */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px]"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(20,184,166,.2) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-teal-400/60">
            {eyebrow}
          </p>
          <h1 className="font-black text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/50">
            {description}
          </p>
          <div className="mt-8 inline-flex items-center gap-2 border border-teal-700/35 bg-teal-950/60 px-4 py-2 text-xs text-teal-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400/60" />
            Last updated: {lastUpdated}
          </div>
        </div>
      </section>

      {/* ── Body: sidebar TOC + content ───────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-16">
          {/* Sidebar TOC */}
          <aside className="mb-10 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <p className="mb-4 text-[10px] font-black uppercase tracking-eyebrow text-muted-foreground/60">
                On this page
              </p>
              <nav className="space-y-1">
                {toc.map((entry) => (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    className="group flex items-center gap-2 border-l-2 border-border py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                      {entry.label}
                    </span>
                  </a>
                ))}
              </nav>

              {/* Back to home */}
              <div className="mt-8 border-t border-border pt-6">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-75"
                >
                  <ArrowLeft size={12} className="shrink-0" /> Back to Schduled
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className="prose-legal">{children}</article>
        </div>
      </div>

      {/* ── CTA band ──────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="mb-2 text-xs font-black uppercase tracking-eyebrow text-primary">
            Ready to start?
          </p>
          <h2 className="font-black text-2xl sm:text-3xl">
            Scheduling made simple. Free forever.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No credit card, no paid plans. Your booking link is ready in 2 minutes.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex items-center gap-2 bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started free
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-page">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo variant="full" size="lg" href="/" />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Smart scheduling for modern professionals. Free forever, open source.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: [
                  ["Features", "/#features"],
                  ["How It Works", "/#how-it-works"],
                  ["FAQ", "/#faq"],
                ],
              },
              {
                title: "Company",
                links: [
                  ["Privacy Policy", "/privacy"],
                  ["Terms of Service", "/terms"],
                  ["Cookie Policy", "/cookies"],
                ],
              },
              {
                title: "Social",
                links: [
                  ["GitHub", "https://github.com"],
                  ["Twitter / X", "https://twitter.com"],
                  ["LinkedIn", "https://linkedin.com"],
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-xs font-black uppercase tracking-eyebrow text-foreground">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                        {href.startsWith("http") && (
                          <ArrowUpRight size={11} className="opacity-40" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-border pt-6">
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Schduled. All rights reserved. Built with care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Shared prose components ─────────────────────────────────────────────────

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-28">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-5 w-1 bg-primary" />
        <h2 className="font-black text-xl text-foreground">{title}</h2>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground pl-4">
        {children}
      </div>
    </section>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function LegalUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-2 border-l-2 border-border pl-5">
      {children}
    </ul>
  );
}

export function LegalLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative before:absolute before:-left-[1.2rem] before:top-[0.4em] before:h-1 before:w-1 before:rounded-full before:bg-primary/60">
      {children}
    </li>
  );
}

export function LegalHighlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-primary/20 bg-primary/5 px-5 py-4 text-sm">
      <p className="font-medium text-foreground">{children}</p>
    </div>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-ui text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
