"use client"

import { useRef, useState } from "react"
import { motion, useMotionValueEvent, useScroll } from "framer-motion"
import { BadgeCheck, ClipboardList, Printer, ScanLine, Wrench } from "lucide-react"
import { StepPhone } from "./phone-screens"
import { Reveal } from "./motion"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    icon: Printer,
    who: "Admin / IT",
    title: "Tag every asset",
    desc: "Print durable QR tags in batches and attach one to every desk, fan, chair, and projector. Each tag is linked to a room, category, and acquisition record.",
    takeaway: "An unambiguous, scannable identity for every asset in the school.",
  },
  {
    icon: ScanLine,
    who: "Teacher",
    title: "Scan in seconds",
    desc: "Any phone camera works — no app install required. Open the camera, point at the QR, and tap the link. The asset, room, and category are pre-filled.",
    takeaway: "Reporting starts in under 30 seconds, even for non-technical staff.",
  },
  {
    icon: ClipboardList,
    who: "Teacher",
    title: "Report the damage",
    desc: "Snap up to 3 geo-tagged photos, pick a category, set urgency, and describe the problem. A ticket is created automatically — no form to fax, no logbook to lose.",
    takeaway: "A complete, photo-backed ticket lands in the principal's queue.",
  },
  {
    icon: Wrench,
    who: "Principal",
    title: "Triage & assign",
    desc: "Principals review, set priority, and assign maintenance staff — or escalate to barangay or DepEd when budget or external help is needed.",
    takeaway: "A clear accountability chain from request to assigned worker.",
  },
  {
    icon: BadgeCheck,
    who: "Teacher",
    title: "Verify the fix",
    desc: "Maintenance posts a before/after photo and marks the ticket resolved. The reporting teacher signs off — or re-opens it — and the asset's history is updated for audits.",
    takeaway: "Every repair is verified by the person who reported the problem.",
  },
]

export function StickyHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  // Track the user's vertical progress through the section. The phone
  // column stays sticky on the right while the text scrolls on the left.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(STEPS.length - 1, Math.max(0, Math.floor(value * STEPS.length)))
    setActive((prev) => (prev === next ? prev : next))
  })

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative border-b border-border/60 bg-background"
    >
      <div className="w-full px-6 md:px-12 lg:px-16">
        {/* Intro sits above the sticky column */}
        <Reveal>
          <div className="max-w-2xl pt-20 md:pt-24">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">How it works</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              From a damaged desk to a verified repair, in five transparent steps.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Scroll to walk through the flow. The phone on the right updates as each role hands off
              to the next — teacher to principal to maintenance, then back to the teacher for
              verification.
            </p>
          </div>
        </Reveal>

        {/* The sticky scroll experience */}
        <div className="mt-12 grid gap-10 pb-20 md:pb-24 lg:grid-cols-12 lg:gap-8">
          {/* Left: scrolling narrative */}
          <ol className="lg:col-span-7">
            {STEPS.map((step, i) => (
              <Step key={step.title} index={i} active={active} {...step} />
            ))}
          </ol>

          {/* Right: sticky phone (desktop only) */}
          <div className="relative hidden lg:col-span-5 lg:block">
            <div className="sticky top-24 flex h-[calc(100vh-8rem)] items-center justify-center">
              <div className="relative">
                <StepPhone step={active} />

                {/* Progress rail */}
                <div
                  aria-hidden="true"
                  className="absolute top-1/2 -left-10 flex h-52 -translate-y-1/2 flex-col items-center gap-2"
                >
                  {STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-8 w-0.5 rounded-full transition-colors duration-300",
                        i <= active ? "bg-primary" : "bg-border",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile / tablet: compact phone that sits between steps */}
          <div className="lg:hidden">
            <div className="flex items-center justify-center rounded-3xl border border-border bg-secondary/30 py-8">
              <StepPhone step={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({
  index,
  active,
  icon: Icon,
  who,
  title,
  desc,
  takeaway,
}: {
  index: number
  active: number
  icon: React.ComponentType<{ className?: string }>
  who: string
  title: string
  desc: string
  takeaway: string
}) {
  const isActive = index === active
  const isPast = index < active

  return (
    <li
      className={cn(
        "relative flex min-h-[70vh] flex-col justify-center border-l border-border py-10 pl-8 transition-opacity duration-500 lg:min-h-[80vh]",
        isActive ? "opacity-100" : "opacity-50",
      )}
      aria-current={isActive ? "step" : undefined}
    >
      {/* step marker */}
      <span
        className={cn(
          "absolute top-1/2 -left-[11px] flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all duration-300",
          isActive
            ? "scale-110 border-primary bg-primary shadow-[0_0_0_6px_var(--color-primary)/15]"
            : isPast
              ? "border-primary bg-primary"
              : "border-border bg-background",
        )}
        aria-hidden="true"
      >
        {(isActive || isPast) && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </span>

      <motion.div
        animate={{
          y: isActive ? 0 : 8,
          opacity: isActive ? 1 : 0.6,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-300",
              isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Step 0{index + 1} · {who}
            </p>
            <h3 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
              {title}
            </h3>
          </div>
        </div>

        <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">{desc}</p>

        <p className="mt-4 inline-flex max-w-xl items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden="true" />
          <span>{takeaway}</span>
        </p>
      </motion.div>
    </li>
  )
}
