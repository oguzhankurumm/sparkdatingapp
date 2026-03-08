import Link from 'next/link'

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'KVKK', href: '/kvkk' },
] as const

export function LegalFooter() {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="text-text-muted text-sm">
          &copy; {new Date().getFullYear()} Spark Technologies Ltd.
        </p>
        <nav className="flex flex-wrap gap-6">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              className="text-text-muted hover:text-text-primary text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
