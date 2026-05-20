import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevVault — Zero-Knowledge Secrets",
  description: "AES-256-GCM client-side encrypted secrets management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
