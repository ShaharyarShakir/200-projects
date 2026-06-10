import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { NeonAuthUIProvider, UserButton } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";
// import '@neondatabase/neon-js/ui/css';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Event Planner",
  description: "Plan your events with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NeonAuthUIProvider authClient={authClient} defaultTheme="dark">
          <header className="border-b border-border bg-background/90 backdrop-blur ">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 ">
              <Link href={"/"} className="text-sm font-semibold tracking-wide">
                Event Planner
              </Link>
              <nav className="flex items-center gap-4">
                <Link href={"/dashboard"} className="text-sm text-muted-foreground">
                  Dashboard
                </Link>
                <UserButton size={"icon"} />
              </nav>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
            {children}
          </main>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
