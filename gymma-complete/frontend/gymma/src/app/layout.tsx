import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gymma Find your perfect gym",
    template: "%s | Gymma",
  },
  description:
    "Discover, compare, and join the best gyms in your city. India-first gym discovery with verified member reviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="font-sans">{children}</body>
    </html>
  );
}
