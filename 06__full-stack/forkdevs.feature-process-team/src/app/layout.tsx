import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Forkdevs — Product Engineering Studio",
    template: "%s | Forkdevs",
  },
  description: "Product engineering studio",
  openGraph: {
    title: "Forkdevs — Product Engineering Studio",
    description: "Product engineering studio",
    siteName: "Forkdevs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forkdevs — Product Engineering Studio",
    description: "Product engineering studio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
