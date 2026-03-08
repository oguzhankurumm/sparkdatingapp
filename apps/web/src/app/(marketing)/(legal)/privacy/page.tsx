import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Spark',
  description: 'Learn how Spark collects, uses, and protects your personal data.',
}

const LAST_UPDATED = 'March 8, 2026'

export default function PrivacyPolicyPage() {
  return (
    <div>
      <header className="mb-10">
        <h1 className="text-text-primary text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
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
            <a href="#information-we-collect" className="hover:text-primary">
              Information We Collect
            </a>
          </li>
          <li>
            <a href="#how-we-use" className="hover:text-primary">
              How We Use Your Information
            </a>
          </li>
          <li>
            <a href="#data-sharing" className="hover:text-primary">
              Data Sharing & Disclosure
            </a>
          </li>
          <li>
            <a href="#your-rights" className="hover:text-primary">
              Your Rights (GDPR)
            </a>
          </li>
          <li>
            <a href="#data-retention" className="hover:text-primary">
              Data Retention
            </a>
          </li>
          <li>
            <a href="#cookies" className="hover:text-primary">
              Cookies & Tracking
            </a>
          </li>
          <li>
            <a href="#security" className="hover:text-primary">
              Security
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:text-primary">
              Contact Us
            </a>
          </li>
        </ol>
      </nav>

      {/* Sections */}
      <div className="space-y-10">
        <Section id="information-we-collect" title="1. Information We Collect">
          <p>
            We collect information you provide directly, such as when you create an account, fill
            out your profile, or contact us. This includes:
          </p>
          <ul>
            <li>Name, email address, date of birth, and gender</li>
            <li>Profile photos and bio information</li>
            <li>Location data (with your consent)</li>
            <li>Messages and communications within the platform</li>
            <li>Payment and transaction information</li>
            <li>Device information and usage data</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="how-we-use" title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <ul>
            <li>Provide and improve our dating and social features</li>
            <li>Match you with other users based on your preferences</li>
            <li>Process payments and manage your account</li>
            <li>Send you notifications and updates</li>
            <li>Ensure safety and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="data-sharing" title="3. Data Sharing & Disclosure">
          <p>We do not sell your personal data. We may share information with:</p>
          <ul>
            <li>Service providers who help us operate (hosting, analytics, payment processing)</li>
            <li>Law enforcement when required by law</li>
            <li>
              Other users, as part of the dating experience (profile information you choose to
              share)
            </li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="your-rights" title="4. Your Rights (GDPR)">
          <p>
            Under the General Data Protection Regulation (GDPR), if you are in the European Economic
            Area, you have the following rights:
          </p>
          <ul>
            <li>
              <strong>Right of Access</strong> — Request a copy of your personal data
            </li>
            <li>
              <strong>Right to Rectification</strong> — Correct inaccurate data
            </li>
            <li>
              <strong>Right to Erasure</strong> — Request deletion of your data
            </li>
            <li>
              <strong>Right to Restrict Processing</strong> — Limit how we use your data
            </li>
            <li>
              <strong>Right to Data Portability</strong> — Receive your data in a portable format
            </li>
            <li>
              <strong>Right to Object</strong> — Object to data processing
            </li>
            <li>
              <strong>Right to Withdraw Consent</strong> — Withdraw consent at any time
            </li>
          </ul>
          <p>
            To exercise your rights, visit your Profile Settings or contact us at the address below.
          </p>
          <Placeholder />
        </Section>

        <Section id="data-retention" title="5. Data Retention">
          <p>
            We retain your personal data for as long as your account is active or as needed to
            provide you services. After account deletion, we retain certain data for up to 30 days
            before permanent deletion, and some anonymized data for analytics and legal compliance
            purposes.
          </p>
          <Placeholder />
        </Section>

        <Section id="cookies" title="6. Cookies & Tracking">
          <p>
            We use cookies and similar technologies to provide functionality, remember your
            preferences, and understand how you use Spark. You can manage your cookie preferences
            through our cookie consent banner or your browser settings.
          </p>
          <Placeholder />
        </Section>

        <Section id="security" title="7. Security">
          <p>
            We implement industry-standard security measures to protect your personal data,
            including encryption in transit and at rest, regular security audits, and access
            controls.
          </p>
          <Placeholder />
        </Section>

        <Section id="contact" title="8. Contact Us">
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data rights,
            contact us:
          </p>
          <div className="border-border bg-surface rounded-lg border p-4">
            <p className="text-text-primary font-medium">Spark Technologies Ltd.</p>
            <p className="text-text-secondary">Data Protection Officer</p>
            <p className="text-text-secondary">Email: privacy@spark.app</p>
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
