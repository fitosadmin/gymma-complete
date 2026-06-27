import * as React from "react";
import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GymNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <MapPinOff className="h-12 w-12 text-neutral-300" />
      <h1 className="mt-4 text-h3 text-neutral-900">Gym not found</h1>
      <p className="mt-2 text-body text-neutral-600">
        This gym may have been removed or the link is incorrect.
      </p>
      <Link href="/explore" className="mt-6">
        <Button>Back to explore</Button>
      </Link>
    </div>
  );
}
