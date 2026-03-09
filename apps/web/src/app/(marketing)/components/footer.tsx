import Link from 'next/link'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Download', href: '/register' },
      { label: 'Safety', href: '/safety' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'KVKK', href: '/kvkk' },
    ],
  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-border/50 border-t py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="font-heading text-text-primary text-xl font-bold">Spark</span>
            </Link>
            <p className="text-text-muted mt-4 max-w-xs text-sm leading-relaxed">
              Dating that feels real. Connect through video, AI, and genuine conversation.
            </p>

            {/* Social icons */}
            <div className="mt-6 flex gap-4">
              {['Twitter', 'Instagram', 'TikTok'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-text-muted hover:text-text-primary text-xs transition-colors"
                  aria-label={social}
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-text-primary text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as never}
                      className="text-text-muted hover:text-text-primary text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-border/50 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-text-muted text-xs">
            &copy; {year} Spark Technologies Inc. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">Made with 💜 for real connections</p>
        </div>
      </div>
    </footer>
  )
}
