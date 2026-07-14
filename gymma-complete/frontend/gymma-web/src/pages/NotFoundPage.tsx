import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFoundPage({ gymSlug = false }: { gymSlug?: boolean }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-navy-deep px-6 text-center">
      <div aria-hidden className="copper-glow absolute right-0 top-0 translate-x-1/3 -translate-y-1/3" />
      <p className="text-display-xl text-gradient-copper">404</p>
      <h1 className="mt-2 text-h2 text-dark-1">This page skipped leg day.</h1>
      <p className="mt-3 max-w-[44ch] text-body-l text-dark-2">
        {gymSlug
          ? "Looking for a gym? It may have moved or isn't published yet."
          : "The page you're looking for doesn't exist — but great gyms nearby do."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/partner/start">
          <Button variant="on-dark">Build your gym website</Button>
        </Link>
        <Link to="/">
          <Button variant="on-dark" className="!bg-transparent !text-white border-[1.5px] border-white/40">
            Go home
          </Button>
        </Link>
      </div>
    </div>
  )
}
