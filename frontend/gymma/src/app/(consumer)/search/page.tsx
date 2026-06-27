import * as React from "react";
import { SearchExperience } from "@/components/search/search-experience";
import { getGyms } from "@/lib/api";

// Discover / results page — filters sidebar + results grid (with map toggle).
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; location?: string };
}) {
  const res = await getGyms({ limit: 500 });
  const gyms = res.data ?? [];

  return (
    <SearchExperience
      gyms={gyms}
      initialQuery={searchParams.q ?? ""}
      locationLabel={searchParams.location ?? "Bengaluru, Karnataka"}
    />
  );
}
