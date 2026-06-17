import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { NavProgress } from "@/components/nav-progress";
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/config/platform";
import { cn } from "@/lib/utils";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: PRODUCT_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, jakarta.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <NavProgress />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
