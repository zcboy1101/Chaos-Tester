import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chaos-Tester",
  description: "AI-driven API boundary testing engine.",
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
