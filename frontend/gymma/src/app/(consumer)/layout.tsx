import * as React from "react";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
