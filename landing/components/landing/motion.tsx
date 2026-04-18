"use client"

import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion"
import type { ComponentProps, ElementType, ReactNode } from "react"

type Direction = "up" | "down" | "left" | "right" | "none"

const DISTANCE = 20

function makeVariants(direction: Direction, distance: number, reduce: boolean): Variants {
  if (reduce) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.3 } },
    }
  }

  const offset = (() => {
    switch (direction) {
      case "up":
        return { y: distance }
      case "down":
        return { y: -distance }
      case "left":
        return { x: distance }
      case "right":
        return { x: -distance }
      default:
        return {}
    }
  })()

  return {
    hidden: { opacity: 0, scale: 0.98, ...offset },
    show: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }
}

type RevealProps = {
  children: ReactNode
  as?: ElementType
  direction?: Direction
  distance?: number
  delay?: number
  className?: string
  once?: boolean
  amount?: number
} & Omit<ComponentProps<typeof motion.div>, "variants" | "initial" | "animate" | "whileInView"> & Record<string, any>

export function Reveal({
  children,
  as,
  direction = "up",
  distance = DISTANCE,
  delay = 0,
  className,
  once = true,
  amount = 0.2,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion()
  const variants = makeVariants(direction, distance, !!reduce)
  const Component = typeof as === "string" ? (motion as any)[as] : motion.div

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount, margin: "0px 0px -10% 0px" }}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </Component>
  )
}

type StaggerGroupProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  delayChildren?: number
  staggerChildren?: number
  once?: boolean
  amount?: number
} & Omit<ComponentProps<typeof motion.div>, "variants" | "initial" | "animate" | "whileInView"> & Record<string, any>

export function StaggerGroup({
  children,
  as,
  className,
  delayChildren = 0.05,
  staggerChildren = 0.08,
  once = true,
  amount = 0.15,
  ...rest
}: StaggerGroupProps) {
  const reduce = useReducedMotion()
  const variants: Variants = {
    hidden: {},
    show: {
      transition: reduce
        ? { staggerChildren: 0 }
        : { delayChildren, staggerChildren },
    },
  }
  const Component = typeof as === "string" ? (motion as any)[as] : motion.div

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount, margin: "0px 0px -10% 0px" }}
      {...rest}
    >
      {children}
    </Component>
  )
}

type StaggerItemProps = {
  children: ReactNode
  as?: ElementType
  direction?: Direction
  distance?: number
  className?: string
} & Omit<ComponentProps<typeof motion.div>, "variants"> & Record<string, any>

export function StaggerItem({
  children,
  as,
  direction = "up",
  distance = DISTANCE,
  className,
  ...rest
}: StaggerItemProps) {
  const reduce = useReducedMotion()
  const variants = makeVariants(direction, distance, !!reduce)
  const Component = typeof as === "string" ? (motion as any)[as] : motion.div

  return (
    <Component className={className} variants={variants} {...rest}>
      {children}
    </Component>
  )
}

export function Parallax({
  children,
  offset = 50,
  clamp = true,
  className,
}: {
  children: ReactNode
  offset?: number
  clamp?: boolean
  className?: string
}) {
  const { scrollYProgress } = useScroll()
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    clamp ? [0, -offset] : [-offset, offset],
  )

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}
