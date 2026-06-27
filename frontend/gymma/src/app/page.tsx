import { redirect } from "next/navigation";

// Spec PAGE 1 is a consent/location gate that lands on /explore.
// Until that gate is built, route straight to the P0 landing page.
export default function Home() {
  redirect("/explore");
}
