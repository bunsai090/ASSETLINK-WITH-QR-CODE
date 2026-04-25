import { Building2, GraduationCap, Landmark, ShieldCheck, Users } from "lucide-react"
import { Parallax, Reveal, StaggerGroup, StaggerItem } from "./motion"

const ITEMS = [
  { icon: Landmark, label: "Barangay visibility" },
  { icon: Users, label: "Multi-role workflow" },
  { icon: ShieldCheck, label: "Privacy-conscious" },
]

export function TrustBar() {
  return (
    <section aria-label="Trusted by" className="border-b border-border/60 bg-secondary/50">
      <Parallax offset={20} className="w-full px-6 py-8 md:px-12 lg:px-16">
        <Reveal>
          <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Designed around the realities of Philippine public schools
          </p>
        </Reveal>
        <StaggerGroup
          as="ul"
          className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12"
          staggerChildren={0.06}
          delayChildren={0.1}
        >
          {ITEMS.map(({ icon: Icon, label }) => (
            <StaggerItem
              key={label}
              as="li"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{label}</span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Parallax>
    </section>
  )
}
