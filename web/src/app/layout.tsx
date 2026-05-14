import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunIt - Content Aggregator",
  description: "AI-powered content aggregation and social media publishing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
