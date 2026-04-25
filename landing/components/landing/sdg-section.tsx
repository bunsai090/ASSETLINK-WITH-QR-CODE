"use client"

import { BookOpen, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react"
import { Parallax, Reveal, StaggerGroup, StaggerItem } from "./motion"

const POINTS = [
  {
    icon: BookOpen,
    title: "Learning environments that actually work",
    desc: "Broken chairs, leaking roofs, and dead projectors are no longer invisible problems quietly eroding learning time.",
  },
  {
    icon: HeartHandshake,
    title: "Teacher satisfaction & retention",
    desc: "Research links facility adequacy to teacher engagement (Kanaan & Zahran, 2022; Vargas & Bonilla, 2022). AssetLink removes the friction teachers face daily.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability at every step",
    desc: "Every ticket has a reporter, an assignee, a timestamp, and a verification — a transparent chain for audits and official reporting.",
  },
  {
    icon: Sparkles,
    title: "Data-driven resource allocation",
    desc: "Administrative offices see where damage concentrates and where budgets should follow — not guesswork, but signal from the classroom.",
  },
]

export function SdgSection() {
  return (
    <section id="sdg" className="relative overflow-hidden border-b border-border/60 bg-primary text-primary-foreground">
      <div className="al-grid-bg pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true" />
      <Parallax offset={40} className="relative w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <span className="flex h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              Sustainable Development Goal 4
            </span>
            <h2 className="mt-6 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Well-maintained schools are the foundation of quality education.
            </h2>
            <p className="mt-5 max-w-md text-pretty leading-relaxed text-primary-foreground/80 md:text-lg">
              AssetLink was built as a direct, practical response to the conditions described in the
              research — paper-based asset management, lost requests, and delayed repairs that quietly
              degrade the learning environment.
            </p>
            <blockquote className="mt-6 border-l-2 border-accent pl-4 text-sm text-primary-foreground/80">
              &ldquo;Teachers&apos; satisfaction with educational facilities is closely linked to their
              perception of the adequacy and functionality of resources.&rdquo;
              <footer className="mt-2 text-xs text-primary-foreground/60">— Vargas &amp; Bonilla, 2022</footer>
            </blockquote>
          </Reveal>

          <StaggerGroup
            as="ul"
            className="grid gap-4 sm:grid-cols-2 lg:col-span-7"
            staggerChildren={0.1}
            delayChildren={0.15}
          >
            {POINTS.map((p) => {
              const Icon = p.icon
              return (
                <StaggerItem
                  as="li"
                  key={p.title}
                  className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-5 backdrop-blur-sm transition-colors duration-300 hover:bg-primary-foreground/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/10 text-accent">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/75">{p.desc}</p>
                </StaggerItem>
              )
            })}
          </StaggerGroup>
        </div>
      </Parallax>
    </section>
  )
}
