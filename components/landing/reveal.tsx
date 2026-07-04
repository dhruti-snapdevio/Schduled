'use client'

import { motion, useReducedMotion } from 'motion/react'

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2, margin: '0px 0px -60px 0px' }}
      transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : delay / 1000, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
