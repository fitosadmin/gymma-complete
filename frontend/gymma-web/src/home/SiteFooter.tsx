import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'

/* Footer — terminal trust block. Carries the mandated rating disclaimer
   site-wide (§9.1). Still by design: zero animation. */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy-deep">
      <div
        aria-hidden
        className="absolute bottom-0 left-0 size-[460px] -translate-x-1/3 translate-y-1/3 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,106,74,.08), transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-[1296px] px-5 py-16 lg:px-10 xl:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-expanded text-[20px] font-black tracking-wide text-dark-1">GYMMA</p>
            <p className="mt-2 text-[14px] text-dark-3">A home for your gym.</p>
            <a
              href="tel:+919591276584"
              className="mt-5 inline-flex items-center gap-2 rounded-[4px] text-[14px] font-semibold text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <Phone size={14} aria-hidden className="text-copper" /> 95912 76584
            </a>
          </div>
          <nav aria-label="Explore">
            <p className="eyebrow">Explore</p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              <li><a href="#gyms" className="text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-[3px]">Find a Gym</a></li>
              <li><a href="#pricing" className="text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-[3px]">Pricing</a></li>
              <li><Link to="/partner/start" className="text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-[3px]">Partner with Gymma</Link></li>
            </ul>
          </nav>
          <nav aria-label="Company">
            <p className="eyebrow">Company</p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-dark-3">
              <li>About — coming soon</li>
              <li>Careers — coming soon</li>
              <li><a href="tel:+919591276584" className="text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-[3px]">Contact</a></li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <p className="eyebrow">Legal</p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-dark-3">
              <li>Privacy Policy — coming soon</li>
              <li>Terms of Service — coming soon</li>
              <li>Rating Disclaimer — below</li>
            </ul>
          </nav>
        </div>
        <div className="mt-14 border-t border-white/10 pt-6">
          <p className="max-w-[90ch] text-caption text-dark-3">
            All ratings and reviews are submitted by users and do not represent the platform's
            opinions. Users should visit and evaluate gyms personally before purchasing memberships.
            The platform is not responsible for decisions made based on reviews or listings.
          </p>
          <p className="mt-3 text-caption text-dark-3">© Gymma 2026 · Made in India</p>
        </div>
      </div>
    </footer>
  )
}
