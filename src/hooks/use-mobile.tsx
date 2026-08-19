import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = typeof window.matchMedia === "function"
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      : null
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    const onMediaChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    window.addEventListener("resize", onResize, { passive: true })
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener("change", onMediaChange)
    } else {
      mediaQuery?.addListener(onMediaChange)
    }

    return () => {
      window.removeEventListener("resize", onResize)
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener("change", onMediaChange)
      } else {
        mediaQuery?.removeListener(onMediaChange)
      }
    }
  }, [])

  return isMobile
}
