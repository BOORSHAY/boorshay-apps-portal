
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOORSHAY APPS",
  description: "BOORSHAY APPS Customer and Owner Portal",
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
