import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";

import { RouteChangeLoader } from "@/components/route-change-loader";
import { LoaderProvider } from "@/components/loader-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "invex",
  description: "Connect businesses with investors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo_invex.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoaderProvider>
          <AuthProvider>
            <Navbar />
            <RouteChangeLoader>{children}</RouteChangeLoader>
          </AuthProvider>
        </LoaderProvider>
      </body>
    </html>
  );
}