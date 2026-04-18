import { BookOpen, GitBranch, ListChecks, Users2 } from "lucide-react"
import { Reveal, StaggerGroup, StaggerItem } from "./motion"

const PILLARS = [
  {
    icon: GitBranch,
    tag: "Process",
    title: "Agile Scrum with two-week sprints",
    bullets: [
      "Sprint 0: requirements, user stories, acceptance criteria",
      "Iterative releases validated with pilot schools each sprint",
      "Retrospectives logged and mapped to changelog entries",
    ],
  },
  {
    icon: ListChecks,
    tag: "Quality",
    title: "ISO/IEC 25010 evaluation criteria",
    bullets: [
      "Functional suitability, usability, reliability, security",
      "Performance efficiency benchmarked against paper-based baseline",
      "Maintainability assessed via role-based code review rubrics",
    ],
  },
  {
    icon: Users2,
    tag: "Respondents",
    title: "Mixed-method field evaluation",
    bullets: [
      "Public elementary and secondary school teachers and principals",
      "Division Maintenance and Operations personnel (DepEd)",
      "Barangay officials in pilot LGU partnerships",
    ],
  },
  {
    icon: BookOpen,
    tag: "Instruments",
    title: "Validated research instruments",
    bullets: [
      "Pre- and post-deployment surveys (5-point Likert, Cronbach α ≥ 0.80)",
      "Semi-structured interviews with principals and maintenance staff",
      "SUS (System Usability Scale) administered after pilot use",
    ],
  },
]

export function MethodologySection() {
  return (
    <section id="methodology" className="border-b border-border/60 bg-background">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                Research methodology
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
                Built with the rigor a DepEd rollout demands.
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
                AssetLink is the artifact of an applied research study. Every feature was validated
                against established software-quality standards and refined with feedback from the
                people who will actually use it in the field.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-nowrap">
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Applied research
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Design science
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Mixed-method
              </span>
            </div>
          </div>
        </Reveal>

        <StaggerGroup
          className="mt-12 grid gap-4 md:grid-cols-2"
          staggerChildren={0.1}
          delayChildren={0.1}
        >
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <StaggerItem
                key={pillar.title}
                as="article"
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    {pillar.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{pillar.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {pillar.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-1 flex-none rounded-full bg-primary"
                      />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </div>
    </section>
  )
}
