import { BadgeCheck, ClipboardList, QrCode, ScanLine, Wrench } from "lucide-react"
import { Reveal, StaggerGroup, StaggerItem } from "./motion"

const STEPS = [
  {
    icon: QrCode,
    title: "Tag",
    desc: "Print durable QR tags and attach one to every asset — desks, fans, chairs, projectors.",
    who: "Admin / IT",
  },
  {
    icon: ScanLine,
    title: "Scan",
    desc: "Teachers scan with any phone camera — no app install required for basic reporting.",
    who: "Teacher",
  },
  {
    icon: ClipboardList,
    title: "Report",
    desc: "Snap a photo, describe the damage, mark urgency. A ticket is created automatically.",
    who: "Teacher",
  },
  {
    icon: Wrench,
    title: "Assign",
    desc: "Principals triage and assign to maintenance. Escalate to barangay or DepEd when needed.",
    who: "Principal",
  },
  {
    icon: BadgeCheck,
    title: "Verify",
    desc: "Teacher confirms the fix. The asset's history is updated for audits and reporting.",
    who: "Teacher",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border/60">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">How it works</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              From damaged desk to verified repair, in five transparent steps.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              AssetLink builds a clear, auditable chain of accountability for every maintenance
              request — visible to the teacher who reported it, the principal who approved it, and the
              supervisor monitoring the division.
            </p>
          </div>
        </Reveal>

        <StaggerGroup
          as="ol"
          className="mt-12 grid gap-4 md:grid-cols-5"
          staggerChildren={0.1}
          delayChildren={0.1}
        >
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <StaggerItem
                key={step.title}
                as="li"
                className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                <span className="mt-4 inline-flex w-fit rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {step.who}
                </span>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </div>
    </section>
  )
}
