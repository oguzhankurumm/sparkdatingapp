'use client'

/**
 * Skip Navigation Link — WCAG 2.2 AA requirement.
 * Visually hidden until focused, then slides into view.
 * Keyboard users can skip the tab bar and jump straight to content.
 */
export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="bg-primary text-on-primary fixed left-4 top-4 z-[9999] -translate-y-full rounded-lg px-4 py-2 text-sm font-semibold transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  )
}
