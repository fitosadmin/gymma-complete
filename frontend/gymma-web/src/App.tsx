import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

/* Route-level chunks (D13) — the homepage never pays for the builder,
   confetti, or QR code; gym pages never pay for wizard steps. */
const BuilderPage = lazy(() => import('./builder/BuilderPage').then((m) => ({ default: m.BuilderPage })))
const GymRoute = lazy(() => import('./gym/GymRoute').then((m) => ({ default: m.GymRoute })))
const ReviewPage = lazy(() => import('./review/ReviewPage').then((m) => ({ default: m.ReviewPage })))

/** Copper thread — the route-loading affordance (D7). */
function RouteLoader() {
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[2px] overflow-hidden">
      <div className="h-full w-1/3 animate-shimmer bg-gradient-brand" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/partner/start" element={<BuilderPage />} />
          <Route path="/gym/:slug" element={<GymRoute />} />
          <Route path="/design-system" element={<ReviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
