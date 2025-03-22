import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Deepseek",
  description:
    "Unlock deep insights and analytics with Deepseek, a powerful Next.js project designed for data-driven exploration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider
        appearance={{
          baseTheme: dark,
        }}
      >
        <AppProvider>
          <body className={`antialiased max-h-screen`}>{children}</body>
        </AppProvider>
      </ClerkProvider>
    </html>
  );
}
