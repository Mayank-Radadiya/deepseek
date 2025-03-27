import type { Metadata } from "next";
import "./globals.css";
import "./prism.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "sonner";

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
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <AppProvider>
        <html lang="en">
          <body className={`antialiased max-h-screen`}>
            {children}
            <Toaster />
          </body>
        </html>
      </AppProvider>
    </ClerkProvider>
  );
}
