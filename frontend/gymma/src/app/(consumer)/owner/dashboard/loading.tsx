import * as React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}
