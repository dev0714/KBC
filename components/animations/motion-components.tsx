'use client'

import { motion } from 'framer-motion'
import React from 'react'

export interface AnimationProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export const FadeInUp = ({ children, delay = 0, duration = 0.5, className = '' }: AnimationProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration }}
    className={className}
  >
    {children}
  </motion.div>
)

export const FadeInDown = ({ children, delay = 0, duration = 0.5, className = '' }: AnimationProps) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration }}
    className={className}
  >
    {children}
  </motion.div>
)

export const FadeInLeft = ({ children, delay = 0, duration = 0.5, className = '' }: AnimationProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration }}
    className={className}
  >
    {children}
  </motion.div>
)

export const FadeInRight = ({ children, delay = 0, duration = 0.5, className = '' }: AnimationProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration }}
    className={className}
  >
    {children}
  </motion.div>
)

export const ScaleIn = ({ children, delay = 0, duration = 0.5, className = '' }: AnimationProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration }}
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  className = '',
}: {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerItem = ({ children, className = '' }: AnimationProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    className={className}
  >
    {children}
  </motion.div>
)

export const HoverScale = ({
  children,
  scale = 1.05,
  className = '',
}: {
  children: React.ReactNode
  scale?: number
  className?: string
}) => (
  <motion.div
    whileHover={{ scale }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
)

export const TapScale = ({
  children,
  scale = 0.95,
  className = '',
}: {
  children: React.ReactNode
  scale?: number
  className?: string
}) => (
  <motion.div
    whileTap={{ scale }}
    className={className}
  >
    {children}
  </motion.div>
)

export const ScrollReveal = ({
  children,
  threshold = 0.2,
  className = '',
}: {
  children: React.ReactNode
  threshold?: number
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true, amount: threshold }}
    className={className}
  >
    {children}
  </motion.div>
)
