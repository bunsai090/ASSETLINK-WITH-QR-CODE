import { AnalyticsPreview } from "@/components/landing/analytics-preview"
import { ComparisonSection } from "@/components/landing/comparison-section"
import { CtaSection } from "@/components/landing/cta-section"
import { FaqSection } from "@/components/landing/faq-section"
import { Hero } from "@/components/landing/hero"
import { MethodologySection } from "@/components/landing/methodology-section"
import { RolePreview } from "@/components/landing/role-preview"
import { SdgSection } from "@/components/landing/sdg-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { StickyHowItWorks } from "@/components/landing/sticky-how-it-works"
import { TeamSection } from "@/components/landing/team-section"
import { TrustBar } from "@/components/landing/trust-bar"

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteNav />
      <main className="relative flex-1">
        <Hero />
        <TrustBar />
        <StickyHowItWorks />
        <RolePreview />
        <AnalyticsPreview />
        <MethodologySection />
        <ComparisonSection />
        <SdgSection />
        <FaqSection />
        <TeamSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
