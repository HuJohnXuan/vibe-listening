import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "R&B Fireplace Radar",
  description: "A warm, private desktop listening room for R&B.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
