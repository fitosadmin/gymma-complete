import { useEffect, useState } from 'react'

/**
 * Gate for Level 2 storytelling (pins, scrubs, parallax):
 * desktop width + fine pointer + motion allowed (D4/D13).
 * Everything else gets the recomposed static/mobile variant.
 */
export function useDesktopStory(): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(
      '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    )
    const update = () => setEnabled(query.matches)
    update()
    // window resize backs up MQ change — some embedded/emulated
    // contexts resize the viewport without dispatching media events
    query.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      query.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return enabled
}
