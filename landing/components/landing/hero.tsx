"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, QrCode, ShieldCheck } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { QrPhoneMock } from "./qr-phone-mock"
import { StaggerGroup, StaggerItem } from "./motion"
import { useLenis } from "./smooth-scroll"
import { Counter } from "./counter"

const ROTATING_VERBS = ["Scanned.", "Reported.", "Repaired.", "Verified."]

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const lenis = useLenis()
  const reduce = useReducedMotion()
  const [verbIndex, setVerbIndex] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setVerbIndex((i) => (i + 1) % ROTATING_VERBS.length)
    }, 2400)
    return () => clearInterval(id)
  }, [reduce])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  // Subtle parallax — phone drifts up, content fades slightly as hero leaves viewport
  const phoneY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -80])
  const phoneOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.4])
  const gridY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 60])

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-b border-border/60">
      <motion.div
        style={{ y: gridY }}
        className="al-grid-bg pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-background via-background/80 to-transparent"
        aria-hidden="true"
      />

      <div className="relative grid w-full gap-12 px-6 pt-16 pb-20 md:px-12 md:pt-24 md:pb-28 lg:grid-cols-12 lg:gap-8 lg:px-16">
        <StaggerGroup
          as="div"
          className="flex flex-col justify-center lg:col-span-7"
          delayChildren={0.1}
          staggerChildren={0.09}
          amount={0.3}
        >
          <StaggerItem
            as="a"
            href="#sdg"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Aligned with SDG 4 — Quality Education
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </StaggerItem>

          <StaggerItem
            as="h1"
            className="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl"
          >
            Every broken desk, chair, and fan —{" "}
            <span
              aria-live="polite"
              className="relative inline-flex items-baseline align-baseline"
            >
              <span className="invisible whitespace-nowrap text-primary" aria-hidden="true">
                {/* Reserve width for the longest word to prevent layout shift */}
                Reported.
              </span>
              <span className="absolute inset-0">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATING_VERBS[verbIndex]}
                    initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="block whitespace-nowrap text-primary"
                  >
                    {ROTATING_VERBS[verbIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </StaggerItem>

          <StaggerItem
            as="p"
            className="mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground md:text-lg"
          >
            automated repair tickets, and transparent dashboards — so teachers can teach, principals can
            act, and maintenance gets clear work orders.
          </StaggerItem>

          <StaggerItem className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="group" asChild>
              <a href="http://localhost:5173">
                Get started
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" onClick={() => lenis?.scrollTo('#how-it-works')}>
              See how it works
            </Button>
          </StaggerItem>

          <StaggerItem
            as="dl"
            className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-6"
          >
            <div>
              <dt className="text-xs text-muted-foreground">Avg. report time</dt>
              <dd className="mt-1 font-serif text-2xl text-foreground">
                <Counter to={28} suffix="s" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Paper forms</dt>
              <dd className="mt-1 font-serif text-2xl text-foreground">
                <Counter to={0} from={12} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Resolution lift</dt>
              <dd className="mt-1 font-serif text-2xl text-foreground">
                <Counter to={62} suffix="%" />
              </dd>
            </div>
          </StaggerItem>

          <StaggerItem
            as="ul"
            className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            <li className="flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-primary" aria-hidden="true" />
              Printable QR tags
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Teacher-verified repairs
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Policy-ready
            </li>
          </StaggerItem>
        </StaggerGroup>

        <motion.div
          style={{ y: phoneY, opacity: phoneOpacity }}
          className="relative flex items-center justify-center lg:col-span-5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <QrPhoneMock />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
