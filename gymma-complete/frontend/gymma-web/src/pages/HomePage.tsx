import { SiteNav } from '../home/SiteNav'
import { SiteFooter } from '../home/SiteFooter'
import { Hero } from '../home/sections/Hero'
import { Problem } from '../home/sections/Problem'
import { TrustStory } from '../home/sections/TrustStory'
import { Tiers } from '../home/sections/Tiers'
import { FeaturedGyms } from '../home/sections/FeaturedGyms'
import { MemberApp } from '../home/sections/MemberApp'
import { Owners } from '../home/sections/Owners'
import { HowItWorks } from '../home/sections/HowItWorks'
import { PricingPreview } from '../home/sections/PricingPreview'
import { FinalCta } from '../home/sections/FinalCta'

/*
 * The homepage — one story told once, for both audiences (Blueprint D9):
 * intrigue → recognition → revelation → aspiration → agency → delight →
 * ambition → relief → respect → resolve.
 */
export function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-sm focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Hero />
        <Problem />
        <TrustStory />
        <Tiers />
        <FeaturedGyms />
        <MemberApp />
        <Owners />
        <HowItWorks />
        <PricingPreview />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
