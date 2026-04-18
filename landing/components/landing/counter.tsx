"use client"

import { useEffect, useRef } from "react"
import { animate, useInView, useReducedMotion } from "framer-motion"

type CounterProps = {
  from?: number
  to: number
  duration?: number
  /** Thousands separator etc. */
  format?: (value: number) => string
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

/**
 * Animates a number count-up the first time it scrolls into view.
 * Respects prefers-reduced-motion by jumping straight to the final value.
 */
export function Counter({
  from = 0,
  to,
  duration = 1.8,
  format,
  prefix = "",
  suffix = "",
  className,
  decimals = 0,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduce = useReducedMotion()

  const formatter =
    format ??
    ((v: number) =>
      v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }))

  useEffect(() => {
    if (!inView || !ref.current) return
    const node = ref.current

    if (reduce) {
      node.textContent = `${prefix}${formatter(to)}${suffix}`
      return
    }

    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = `${prefix}${formatter(v)}${suffix}`
      },
    })

    return () => controls.stop()
  }, [inView, from, to, duration, prefix, suffix, formatter, reduce])

  // Initial render shows the `from` value so the layout doesn't flicker
  return (
    <span ref={ref} className={className} aria-label={`${prefix}${formatter(to)}${suffix}`}>
      {`${prefix}${formatter(from)}${suffix}`}
    </span>
  )
}
