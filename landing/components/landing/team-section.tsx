import { Github, Linkedin, Mail } from "lucide-react"
import { Reveal, StaggerGroup, StaggerItem } from "./motion"

type Member = {
  name: string
  role: string
  focus: string
  initials: string
  accent: string
}

const TEAM: Member[] = [
  {
    name: "Project Lead",
    role: "Principal Researcher",
    focus: "Stakeholder mapping, DepEd coordination, thesis defense owner.",
    initials: "PL",
    accent: "bg-primary/15 text-primary",
  },
  {
    name: "UX Researcher",
    role: "Field Research & Usability",
    focus: "Teacher and principal interviews, SUS evaluation, interaction design.",
    initials: "UX",
    accent: "bg-accent/20 text-accent",
  },
  {
    name: "Full-stack Developer",
    role: "Engineering",
    focus: "Next.js, Supabase RLS, QR pipeline, offline sync, role-based auth.",
    initials: "FS",
    accent: "bg-primary/10 text-primary",
  },
  {
    name: "Documentation Lead",
    role: "Research & Writing",
    focus: "Literature review, manuscript chapters, MOOE policy alignment.",
    initials: "DL",
    accent: "bg-secondary text-foreground",
  },
]

const ADVISORS = [
  "Thesis adviser — IT / SE department",
  "Technical panel — software quality (ISO 25010)",
  "External panel — DepEd Division representative",
]

export function TeamSection() {
  return (
    <section id="team" className="border-b border-border/60 bg-secondary/40">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              The research team
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Four researchers building one tool for thousands of classrooms.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              A capstone team spanning software engineering, field research, and DepEd policy —
              each accountable for a distinct part of the deliverable.
            </p>
          </div>
        </Reveal>

        <StaggerGroup
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          staggerChildren={0.1}
          delayChildren={0.1}
        >
          {TEAM.map((m) => (
            <StaggerItem
              key={m.name}
              as="article"
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold tracking-wide transition-transform duration-300 group-hover:scale-105 ${m.accent}`}
                aria-hidden="true"
              >
                {m.initials}
              </div>
              <p className="mt-4 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {m.role}
              </p>
              <h3 className="mt-1 font-serif text-xl tracking-tight text-foreground">{m.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{m.focus}</p>
              <div className="mt-5 flex items-center gap-2">
                <IconLink href="#" label={`Email ${m.name}`} icon={Mail} />
                <IconLink href="#" label={`${m.name} on LinkedIn`} icon={Linkedin} />
                <IconLink href="#" label={`${m.name} on GitHub`} icon={Github} />
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal delay={0.2}>
          <div className="mt-10 rounded-2xl border border-border bg-background p-6">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              Panel &amp; advisers
            </p>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {ADVISORS.map((a) => (
                <li
                  key={a}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary"
                  />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function IconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  )
}
