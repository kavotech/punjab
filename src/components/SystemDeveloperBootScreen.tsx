import { useEffect, useState } from 'react'

const DURATION_MS = 10_000
const RING_SIZE = 132
const RING_STROKE = 4

/** System-Developer-only boot screen - shown for a fixed 10 seconds on cold
    page load, a reload, or right after signing in (see App.tsx's
    devBootActive timer). A real, numeric progress ring rather than
    decorative glow/blur - every other role keeps the plain, fast
    "Preparing your workspace" screen with no added delay. */
export function SystemDeveloperBootScreen({ name }: { name: string }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const tick = () => setPct(Math.min(100, Math.round(((Date.now() - start) / DURATION_MS) * 100)))
    tick()
    const id = window.setInterval(tick, 80)
    return () => window.clearInterval(id)
  }, [])

  const radius = RING_SIZE / 2 - RING_STROKE / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct / 100)

  return (
    <div className="devboot" role="status" aria-live="polite">
      <div className="devboot-content">
        <div className="devboot-ring-wrap" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="devboot-ring">
            <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={RING_STROKE} />
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} fill="none" stroke="#42b968" strokeWidth={RING_STROKE}
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} className="devboot-ring-fill"
            />
          </svg>
          <img src="/logo.png" alt="" className="devboot-logo" />
        </div>
        <p className="devboot-eyebrow">System Developer Access</p>
        <h1 className="devboot-welcome">Welcome, {name}</h1>
        <p className="devboot-sub">Preparing your workspace&hellip;</p>
        <p className="devboot-pct">{pct}%</p>
      </div>
    </div>
  )
}
