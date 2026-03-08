import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Spark',
  description: 'Terms and conditions for using the Spark dating platform.',
}

const LAST_UPDATED = 'March 8, 2026'

export default function TermsOfServicePage() {
  return (
    <div>
      <header className="mb-10">
        <h1 className="text-text-primary text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="text-text-muted mt-2 text-sm">Last updated: {LAST_UPDATED}</p>
      </header>

      {/* Table of Contents */}
      <nav className="border-border bg-surface mb-12 rounded-xl border p-6">
        <h2 className="text-text-muted mb-3 text-sm font-semibold uppercase tracking-wider">
          Contents
        </h2>
        <ol className="text-text-secondary list-inside list-decimal space-y-1.5 text-sm">
          <li>
            <a href="#acceptance" className="hover:text-primary">
              Acceptance of Terms
            </a>
          </li>
          <li>
            <a href="#eligibility" className="hover:text-primary">
              Eligibility
            </a>
          </li>
          <li>
            <a href="#account" className="hover:text-primary">
              Your Account
            </a>
          </li>
          <li>
            <a href="#content" className="hover:text-primary">
              Content & Conduct
            </a>
          </li>
          <li>
            <a href="#prohibited" className="hover:text-primary">
              Prohibited Conduct
            </a>
          </li>
          <li>
            <a href="#payments" className="hover:text-primary">
              Payments & Subscriptions
            </a>
          </li>
          <li>
            <a href="#virtual-currency" className="hover:text-primary">
              Virtual Currency (Tokens)
            </a>
          </li>
          <li>
            <a href="#termination" className="hover:text-primary">
              Termination
            </a>
          </li>
          <li>
            <a href="#disclaimers" className="hover:text-primary">
              Disclaimers
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:text-primary">
              Contact
            </a>
          </li>
        </ol>
      </nav>

      {/* Sections */}
      <div className="space-y-10">
        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            By accessing or using Spark (&ldquo;the Service&rdquo;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, you may not use the Service.
          </p>
          <Placeholder />
        </Section>

        <Section id="eligibility" title="2. Eligibility">
          <p>You must meet the following requirements to use Spark:</p>
          <ul>
            <li>You must be at least 18 years of age</li>
            <li>You must not be prohibited from using the Service under applicable law</li>
            <li>You must not have been previously banned from the Service</li>
            <li>You must be able to form a binding contract</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="account" title="3. Your Account">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account. You agree to provide accurate,
            complete, and current information.
          </p>
          <Placeholder />
        </Section>

        <Section id="content" title="4. Content & Conduct">
          <p>
            You retain ownership of the content you post on Spark. By posting content, you grant us
            a non-exclusive, worldwide, royalty-free license to use, display, and distribute your
            content within the Service.
          </p>
          <Placeholder />
        </Section>

        <Section id="prohibited" title="5. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul>
            <li>Impersonate any person or entity</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Post illegal, harmful, or inappropriate content</li>
            <li>Use the Service for commercial purposes without authorization</li>
            <li>Attempt to circumvent security features or access restrictions</li>
            <li>Use automated systems or bots to interact with the Service</li>
            <li>Solicit money or other items of value from other users</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="payments" title="6. Payments & Subscriptions">
          <p>
            Spark offers optional paid subscriptions (Premium and Platinum) and in-app purchases.
            All purchases are subject to the following:
          </p>
          <ul>
            <li>Prices are in USD and may vary by region</li>
            <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
            <li>Refunds are handled according to the applicable app store policies</li>
            <li>We reserve the right to change pricing with reasonable notice</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="virtual-currency" title="7. Virtual Currency (Tokens)">
          <p>
            Spark uses a virtual currency system (&ldquo;Tokens&rdquo;). Tokens have no real-world
            monetary value outside of the Spark platform. Key terms:
          </p>
          <ul>
            <li>Tokens can be purchased or earned through platform activities</li>
            <li>Tokens are non-transferable outside the platform</li>
            <li>Unused tokens are non-refundable</li>
            <li>We reserve the right to modify the token economy with notice</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="termination" title="8. Termination">
          <p>
            We may suspend or terminate your account if you violate these Terms or for any reason
            with notice. You may delete your account at any time through your Profile Settings. Upon
            deletion:
          </p>
          <ul>
            <li>Your account will be deactivated for 30 days</li>
            <li>After 30 days, your data will be permanently deleted</li>
            <li>Remaining tokens and subscription benefits will be forfeited</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="disclaimers" title="9. Disclaimers">
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind. We do not guarantee that you will find a match, that the Service
            will be uninterrupted, or that other users&apos; information is accurate.
          </p>
          <Placeholder />
        </Section>

        <Section id="contact" title="10. Contact">
          <p>For questions about these Terms, contact us:</p>
          <div className="border-border bg-surface rounded-lg border p-4">
            <p className="text-text-primary font-medium">Spark Technologies Ltd.</p>
            <p className="text-text-secondary">Legal Department</p>
            <p className="text-text-secondary">Email: legal@spark.app</p>
            <p className="text-text-secondary">Address: [Company address placeholder]</p>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-text-primary mb-4 text-xl font-semibold">{title}</h2>
      <div className="text-text-secondary [&_strong]:text-text-primary space-y-3 [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  )
}

function Placeholder() {
  return (
    <div className="border-border bg-surface-elevated/50 mt-4 rounded-lg border border-dashed px-4 py-3">
      <p className="text-text-muted text-xs font-medium italic">
        [Placeholder — Full legal text to be provided by legal counsel]
      </p>
    </div>
  )
}
