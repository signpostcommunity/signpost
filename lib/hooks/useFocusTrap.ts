import { useEffect, useRef } from 'react'

export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    if (!container) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    function trapFocus(e: KeyboardEvent) {
      if (e.key === 'Tab' && container) {
        const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', trapFocus)

    // Focus first focusable element
    requestAnimationFrame(() => {
      if (container) {
        const first = container.querySelector<HTMLElement>(focusableSelector)
        if (first) first.focus()
      }
    })

    return () => {
      document.removeEventListener('keydown', trapFocus)
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  return containerRef
}
