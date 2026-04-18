"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, QrCode, X } from "lucide-react"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"
import { useLenis } from "./smooth-scroll"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Roles", href: "#roles" },
  { label: "Methodology", href: "#methodology" },
  { label: "Compare", href: "#comparison" },
  { label: "FAQ", href: "#faq" },
  { label: "Team", href: "#team" },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const lenis = useLenis()
  const { scrollYProgress, scrollY } = useScroll()

  // Smooth reading-progress bar
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.25,
  })

  // Subtle shrink + deeper blur once the user starts scrolling
  const headerHeight = useTransform(scrollY, [0, 120], [64, 56])
  const headerBlur = useTransform(scrollY, [0, 120], [6, 14])
  const headerBg = useTransform(
    scrollY,
    [0, 120],
    ["color-mix(in oklch, var(--background) 80%, transparent)", "color-mix(in oklch, var(--background) 92%, transparent)"],
  )
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 1])

  return (
    <motion.header
      style={{
        backdropFilter: useTransform(headerBlur, (b) => `blur(${b}px)`),
        WebkitBackdropFilter: useTransform(headerBlur, (b) => `blur(${b}px)`),
        background: headerBg,
      }}
      className="sticky top-0 z-40"
    >
      {/* Animated bottom border that fades in as you scroll */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border"
        style={{ opacity: borderOpacity }}
      />

      <motion.div
        style={{ height: headerHeight }}
        className="flex w-full items-center justify-between gap-6 px-6 md:px-12 lg:px-16"
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-300 hover:scale-105">
            <QrCode className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">AssetLink</span>
          <span className="hidden rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ITPE 104 / SDG 4
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => lenis?.scrollTo(link.href)}
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full"
              />
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="http://localhost:5173">Sign in</a>
          </Button>
          <Button size="sm" asChild>
            <a href="http://localhost:5173">Get started</a>
          </Button>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </motion.div>

      {/* Reading-progress bar */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
        style={{ scaleX: progressScaleX }}
      />

      <div
        className={cn(
          "overflow-hidden border-t border-border/60 md:hidden",
          open ? "max-h-96" : "max-h-0",
          "transition-[max-height] duration-300",
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => {
                setOpen(false)
                lenis?.scrollTo(link.href)
              }}
              className="rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
            >
              {link.label}
            </button>
          ))}
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href="http://localhost:5173">Sign in</a>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <a href="http://localhost:5173">Get started</a>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
