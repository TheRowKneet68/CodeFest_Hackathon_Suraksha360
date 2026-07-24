import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swasthya Sathi - Suraksha360",
  description: "Regional symptom guidance, trusted doctors, and diagnostic costs for patients in Gandaki Province.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
