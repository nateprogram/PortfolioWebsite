"use client"

import React, { useEffect, useRef } from "react"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

import { cn } from "@/lib/utils"

// Canvas of small squares that randomly flicker between opacities.
//
// Tuned for cost (it sits on every page):
//   - opacities are quantized to LEVELS buckets and each bucket is drawn
//     with one fillStyle, instead of building a color string per square
//   - redraws at ~20fps; flicker doesn't need 60
//   - visibility lives in a ref, so scrolling it on/offscreen pauses the
//     loop without tearing down and rebuilding the effect
//   - reduced-motion users get one static frame

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  width?: number
  height?: number
  className?: string
  maxOpacity?: number
}

const LEVELS = 8
const FRAME_MS = 50

function resolveRgb(colorValue: string | undefined): string {
  const el = document.createElement("div")
  el.style.color = colorValue || "var(--foreground)"
  el.style.display = "none"
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  document.body.removeChild(el)
  // Normalize anything (oklch, hex, named) to rgb via a 1px canvas.
  const c = document.createElement("canvas")
  c.width = c.height = 1
  const ctx = c.getContext("2d")
  if (!ctx) return "0, 0, 0"
  ctx.fillStyle = computed || "#000"
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
  return `${r}, ${g}, ${b}`
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color,
  width,
  height,
  className,
  maxOpacity = 0.3,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rgb = resolveRgb(color)
    let cols = 0
    let rows = 0
    let dpr = 1
    let levels = new Uint8Array(0)

    const setup = () => {
      const w = width || container.clientWidth
      const h = height || container.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      cols = Math.floor(w / (squareSize + gridGap))
      rows = Math.floor(h / (squareSize + gridGap))
      levels = new Uint8Array(cols * rows)
      for (let i = 0; i < levels.length; i++) {
        levels[i] = Math.floor(Math.random() * LEVELS)
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const step = (squareSize + gridGap) * dpr
      const size = squareSize * dpr
      for (let lvl = 1; lvl < LEVELS; lvl++) {
        ctx.fillStyle = `rgba(${rgb}, ${((lvl / (LEVELS - 1)) * maxOpacity).toFixed(3)})`
        ctx.beginPath()
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            if (levels[i * rows + j] === lvl) ctx.rect(i * step, j * step, size, size)
          }
        }
        ctx.fill()
      }
    }

    const flicker = (dt: number) => {
      const p = flickerChance * dt
      for (let i = 0; i < levels.length; i++) {
        if (Math.random() < p) levels[i] = Math.floor(Math.random() * LEVELS)
      }
    }

    setup()
    draw()

    const ro = new ResizeObserver(() => {
      setup()
      draw()
    })
    ro.observe(container)

    // Re-resolve the color when the theme class flips.
    const mo = new MutationObserver(() => {
      rgb = resolveRgb(color)
      draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    if (reduceMotion) {
      return () => {
        ro.disconnect()
        mo.disconnect()
      }
    }

    let raf = 0
    let last = 0
    let inView = false
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!inView || document.hidden) return
      if (now - last < FRAME_MS) return
      const dt = last ? Math.min((now - last) / 1000, 0.25) : FRAME_MS / 1000
      last = now
      flicker(dt)
      draw()
    }
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView && !raf) raf = requestAnimationFrame(loop)
      if (!inView && raf) {
        cancelAnimationFrame(raf)
        raf = 0
        last = 0
      }
    })
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      io.disconnect()
    }
  }, [color, width, height, squareSize, gridGap, flickerChance, maxOpacity, reduceMotion])

  return (
    <div ref={containerRef} className={cn("h-full w-full", className)} {...props}>
      <canvas ref={canvasRef} className="pointer-events-none" aria-hidden />
    </div>
  )
}
